import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { seedUser } from "../helpers/auth.js";
import { SLA } from "../../src/models/SLA.js";
import { Category } from "../../src/models/Category.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe("RBAC across roles", () => {
    it("rejects unauthenticated requests to /tickets with 401", async () => {
        const res = await request(app).get("/api/v1/tickets");
        expect(res.status).toBe(401);
    });

    it("rejects invalid tokens with 401", async () => {
        const res = await request(app)
            .get("/api/v1/tickets")
            .set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });

    it("forbids customer from agent-only update endpoint", async () => {
        const customer = await seedUser({
            email: "c@example.com",
            name: "C",
            role: "customer",
        });

        const res = await request(app)
            .put("/api/v1/tickets/64b1aa11aa11aa11aa11aa01")
            .set("Authorization", `Bearer ${customer.token}`)
            .send({ subject: "X" });

        expect(res.status).toBe(403);
    });

    it("forbids customer from creating tickets via admin endpoint", async () => {
        const customer = await seedUser({
            email: "c2@example.com",
            name: "C2",
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

    it("forbids agent from admin-only user management", async () => {
        const agent = await seedUser({
            email: "a@example.com",
            name: "A",
            role: "agent",
        });

        const res = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${agent.token}`);

        expect(res.status).toBe(403);
    });

    it("forbids agent from admin-only reports", async () => {
        const agent = await seedUser({
            email: "a2@example.com",
            name: "A2",
            role: "agent",
        });

        const res = await request(app)
            .get("/api/v1/reports/tickets")
            .set("Authorization", `Bearer ${agent.token}`);

        expect(res.status).toBe(403);
    });

    it("allows admin to list users", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(200);
    });

    it("allows agent to view SLA policies", async () => {
        const agent = await seedUser({
            email: "a3@example.com",
            name: "A3",
            role: "agent",
        });

        const res = await request(app)
            .get("/api/v1/sla")
            .set("Authorization", `Bearer ${agent.token}`);

        expect(res.status).toBe(200);
    });

    it("forbids agent from updating SLA policies", async () => {
        const agent = await seedUser({
            email: "a4@example.com",
            name: "A4",
            role: "agent",
        });

        const res = await request(app)
            .put("/api/v1/sla/urgent")
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ responseTarget: 10, resolutionTarget: 60 });

        expect(res.status).toBe(403);
    });

    it("forbids customer from accessing ticket history", async () => {
        const customer = await seedUser({
            email: "c3@example.com",
            name: "C3",
            role: "customer",
        });

        const res = await request(app)
            .get("/api/v1/tickets/64b1aa11aa11aa11aa11aa01/history")
            .set("Authorization", `Bearer ${customer.token}`);

        expect(res.status).toBe(403);
    });
});

describe("SLA policy validation", () => {
    it("returns 400 when resolution < response", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .put("/api/v1/sla/medium")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ responseTarget: 60, resolutionTarget: 30 });

        expect(res.status).toBe(400);
    });

    it("rejects invalid priority enum", async () => {
        const admin = await seedUser({
            email: "admin2@example.com",
            name: "Admin2",
            role: "admin",
        });

        const res = await request(app)
            .put("/api/v1/sla/critical")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ responseTarget: 30, resolutionTarget: 240 });

        expect(res.status).toBe(400);
    });

    it("rejects non-integer targets", async () => {
        const admin = await seedUser({
            email: "admin3@example.com",
            name: "Admin3",
            role: "admin",
        });

        const res = await request(app)
            .put("/api/v1/sla/low")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ responseTarget: 12.5, resolutionTarget: 240 });

        expect(res.status).toBe(400);
    });
});

describe("GET /api/v1/categories", () => {
    it("returns all categories for an admin", async () => {
        await Category.insertMany([
            { name: "Billing", status: "active" },
            { name: "Tech", status: "active" },
        ]);

        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .get("/api/v1/categories")
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });

    it("filters categories by ?status=inactive", async () => {
        await Category.insertMany([
            { name: "Billing", status: "active" },
            { name: "Old", status: "inactive" },
        ]);

        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .get("/api/v1/categories?status=inactive")
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe("Old");
    });
});

describe("SLA policies list endpoint", () => {
    it("returns all priorities with defaults when none configured", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .get("/api/v1/sla")
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(4);
        for (const p of res.body.data) {
            expect(p.isCustomized).toBe(false);
            expect(typeof p.responseTarget).toBe("number");
            expect(typeof p.resolutionTarget).toBe("number");
        }
    });

    it("upserts a policy and reflects it on subsequent GET", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        await request(app)
            .put("/api/v1/sla/urgent")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ responseTarget: 10, resolutionTarget: 45 })
            .expect(200);

        const get = await request(app)
            .get("/api/v1/sla")
            .set("Authorization", `Bearer ${admin.token}`)
            .expect(200);

        const urgent = get.body.data.find(
            (p: { priority: string }) => p.priority === "urgent",
        );
        expect(urgent.responseTarget).toBe(10);
        expect(urgent.resolutionTarget).toBe(45);
        expect(urgent.isCustomized).toBe(true);
    });
});
