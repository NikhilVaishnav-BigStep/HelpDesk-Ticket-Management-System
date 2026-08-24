import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { seedUser, login } from "../helpers/auth.js";
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

describe("POST /api/v1/auth/register", () => {
    it("registers a customer with valid input", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Carol Customer",
                email: "carol@example.com",
                password: "Password@1234",
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe("carol@example.com");
        expect(res.body.data.role).toBe("customer");
        expect(res.body.data.password).toBeUndefined();
    });

    it("rejects duplicate emails with 409", async () => {
        await seedUser({
            email: "dup@example.com",
            name: "Dup",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Dup2",
                email: "dup@example.com",
                password: "Password@1234",
            });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it("rejects invalid email with 400", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "X",
                email: "not-an-email",
                password: "Password@1234",
            });

        expect(res.status).toBe(400);
    });

    it("rejects short passwords with 400", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "X",
                email: "x@example.com",
                password: "short",
            });

        expect(res.status).toBe(400);
    });
});

describe("POST /api/v1/auth/login", () => {
    it("returns a JWT and user info on valid credentials", async () => {
        const seeded = await seedUser({
            email: "alice@example.com",
            name: "Alice",
            role: "agent",
        });

        const res = await login(app, seeded.email);

        expect(res.status).toBe(200);
        expect(res.body.data.token).toEqual(expect.any(String));
        expect(res.body.data.user.email).toBe(seeded.email);
        expect(res.body.data.user.role).toBe("agent");
    });

    it("rejects wrong password with 401", async () => {
        const seeded = await seedUser({
            email: "bob@example.com",
            name: "Bob",
            role: "customer",
        });

        const res = await login(app, seeded.email, "WrongPassword!1");

        expect(res.status).toBe(401);
    });

    it("rejects unknown email with 401", async () => {
        const res = await login(app, "nobody@example.com", "Password@1234");

        expect(res.status).toBe(401);
    });

    it("rejects login when user is soft-deleted with 401", async () => {
        const seeded = await seedUser({
            email: "deleted@example.com",
            name: "Deleted User",
            role: "customer",
        });

        await User.updateOne(
            { _id: seeded.id },
            { $set: { deleted: true, deletedAt: new Date() } },
        );

        const res = await login(app, seeded.email);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);

        // Also verify that an existing JWT from this deleted user is rejected
        const ticketRes = await request(app)
            .post("/api/v1/tickets")
            .set("Authorization", `Bearer ${seeded.token}`)
            .send({
                subject: "Test Ticket",
                description: "Test description",
                priority: "low",
            });

        expect(ticketRes.status).toBe(401);
    });
});

describe("POST /api/v1/auth/users (admin create user)", () => {
    it("lets an admin create an agent user", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .post("/api/v1/auth/users")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({
                name: "New Agent",
                email: "newagent@example.com",
                password: "Password@1234",
                role: "agent",
                teamId: "tier1",
            });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe("agent");
        expect(res.body.data.password).toBeUndefined();
    });

    it("forbids non-admin from creating users", async () => {
        const customer = await seedUser({
            email: "cust@example.com",
            name: "Cust",
            role: "customer",
        });

        const res = await request(app)
            .post("/api/v1/auth/users")
            .set("Authorization", `Bearer ${customer.token}`)
            .send({
                name: "X",
                email: "x@example.com",
                password: "Password@1234",
                role: "agent",
            });

        expect(res.status).toBe(403);
    });
});
