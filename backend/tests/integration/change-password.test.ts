import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { authHeader, login, seedUser } from "../helpers/auth.js";
import { User } from "../../src/models/User.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const CURRENT_PASSWORD = "Password@1234";
const NEW_PASSWORD = "NewPassword@5678";

describe("POST /api/v1/auth/change-password", () => {
    it("changes the password when current password is correct", async () => {
        const user = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: NEW_PASSWORD,
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeNull();

        const oldLogin = await login(app, user.email, CURRENT_PASSWORD);
        expect(oldLogin.status).toBe(401);

        const newLogin = await login(app, user.email, NEW_PASSWORD);
        expect(newLogin.status).toBe(200);
        expect(newLogin.body.data.token).toEqual(expect.any(String));
    });

    it("allows agents to change their own password", async () => {
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(agent.token))
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: NEW_PASSWORD,
            });

        expect(res.status).toBe(200);

        const newLogin = await login(app, agent.email, NEW_PASSWORD);
        expect(newLogin.status).toBe(200);
    });

    it("allows admins to change their own password", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(admin.token))
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: NEW_PASSWORD,
            });

        expect(res.status).toBe(200);

        const newLogin = await login(app, admin.email, NEW_PASSWORD);
        expect(newLogin.status).toBe(200);
    });

    it("rejects wrong current password with 401", async () => {
        const user = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({
                currentPassword: "WrongPassword@9999",
                newPassword: NEW_PASSWORD,
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);

        const stillOld = await login(app, user.email, CURRENT_PASSWORD);
        expect(stillOld.status).toBe(200);
    });

    it("rejects missing currentPassword with 400", async () => {
        const user = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("rejects missing newPassword with 400", async () => {
        const user = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({ currentPassword: CURRENT_PASSWORD });

        expect(res.status).toBe(400);
    });

    it("rejects too-short newPassword with 400", async () => {
        const user = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: "short",
            });

        expect(res.status).toBe(400);
    });

    it("rejects newPassword equal to currentPassword with 400", async () => {
        const user = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: CURRENT_PASSWORD,
            });

        expect(res.status).toBe(400);
        const messages = (res.body.errors ?? []).map(
            (e: { message: string }) => e.message,
        );
        expect(messages.join(" ")).toEqual(expect.stringMatching(/different/i));
    });

    it("rejects unauthenticated requests with 401", async () => {
        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: NEW_PASSWORD,
            });

        expect(res.status).toBe(401);
    });

    it("returns 404 when the user is soft-deleted", async () => {
        const user = await seedUser({
            email: "ghost@example.com",
            name: "Ghost",
            role: "customer",
        });

        await User.updateOne(
            { _id: user.id },
            { $set: { deleted: true, deletedAt: new Date() } },
        );

        const res = await request(app)
            .post("/api/v1/auth/change-password")
            .set(authHeader(user.token))
            .send({
                currentPassword: CURRENT_PASSWORD,
                newPassword: NEW_PASSWORD,
            });

        expect(res.status).toBe(404);
    });
});

describe("POST /api/v1/users/:id/reset-password (admin only)", () => {
    it("lets an admin reset an agent's password", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });

        const res = await request(app)
            .post(`/api/v1/users/${agent.id}/reset-password`)
            .set(authHeader(admin.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const oldLogin = await login(app, agent.email, CURRENT_PASSWORD);
        expect(oldLogin.status).toBe(401);

        const newLogin = await login(app, agent.email, NEW_PASSWORD);
        expect(newLogin.status).toBe(200);
    });

    it("lets an admin reset a customer's password", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        const customer = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post(`/api/v1/users/${customer.id}/reset-password`)
            .set(authHeader(admin.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(200);

        const newLogin = await login(app, customer.email, NEW_PASSWORD);
        expect(newLogin.status).toBe(200);
    });

    it("forbids customers from resetting anyone's password", async () => {
        const customer = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });

        const res = await request(app)
            .post(`/api/v1/users/${agent.id}/reset-password`)
            .set(authHeader(customer.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(403);
    });

    it("forbids agents from resetting anyone's password", async () => {
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });
        const customer = await seedUser({
            email: "carol@example.com",
            name: "Carol",
            role: "customer",
        });

        const res = await request(app)
            .post(`/api/v1/users/${customer.id}/reset-password`)
            .set(authHeader(agent.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(403);
    });

    it("rejects unauthenticated requests with 401", async () => {
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });

        const res = await request(app)
            .post(`/api/v1/users/${agent.id}/reset-password`)
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(401);
    });

    it("returns 404 for unknown target user", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const fakeId = "507f1f77bcf86cd799439011";
        const res = await request(app)
            .post(`/api/v1/users/${fakeId}/reset-password`)
            .set(authHeader(admin.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(404);
    });

    it("returns 400 for invalid target id format", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .post(`/api/v1/users/not-an-id/reset-password`)
            .set(authHeader(admin.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(400);
    });

    it("returns 404 when target user is soft-deleted", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });

        await User.updateOne(
            { _id: agent.id },
            { $set: { deleted: true, deletedAt: new Date() } },
        );

        const res = await request(app)
            .post(`/api/v1/users/${agent.id}/reset-password`)
            .set(authHeader(admin.token))
            .send({ newPassword: NEW_PASSWORD });

        expect(res.status).toBe(404);
    });

    it("rejects too-short newPassword with 400", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        const agent = await seedUser({
            email: "agent@example.com",
            name: "Agent",
            role: "agent",
        });

        const res = await request(app)
            .post(`/api/v1/users/${agent.id}/reset-password`)
            .set(authHeader(admin.token))
            .send({ newPassword: "short" });

        expect(res.status).toBe(400);
    });
});
