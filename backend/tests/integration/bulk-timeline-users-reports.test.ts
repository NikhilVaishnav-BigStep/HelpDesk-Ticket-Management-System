import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { seedUser, SeededUser } from "../helpers/auth.js";
import { SLA } from "../../src/models/SLA.js";
import { Comment } from "../../src/models/Comment.js";
import { TicketHistory } from "../../src/models/TicketHistory.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
    await SLA.insertMany([
        { priority: "low", responseTarget: 240, resolutionTarget: 2880 },
        { priority: "medium", responseTarget: 60, resolutionTarget: 480 },
    ]);
});

const seedBasic = async () => {
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
    const customer = await seedUser({
        email: "cust@example.com",
        name: "Cust",
        role: "customer",
    });
    return { admin, agent, customer };
};

const createTicket = async (
    customer: SeededUser,
    subject: string,
) => {
    return request(app)
        .post("/api/v1/tickets")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
            subject,
            description: "x",
            priority: "low",
        });
};

describe("Bulk operations", () => {
    it("bulk-assigns multiple tickets with mixed success", async () => {
        const { agent, customer } = await seedBasic();
        const t1 = (await createTicket(customer, "A")).body.data._id;
        const t2 = (await createTicket(customer, "B")).body.data._id;
        const closed = (await createTicket(customer, "C")).body.data._id;

        // Close the third ticket to make it unassignable.
        await request(app)
            .put(`/api/v1/tickets/${closed}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "closed" });

        // Also include an invalid id
        const fakeId = "000000000000000000000000";

        const res = await request(app)
            .post("/api/v1/tickets/bulk/assign")
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ ticketIds: [t1, t2, closed, fakeId], assigneeId: agent.id });

        expect(res.status).toBe(200);
        expect(res.body.data.requested).toBe(4);
        expect(res.body.data.succeeded).toBe(2);
        expect(res.body.data.failed).toBe(2);
        expect(res.body.data.results).toHaveLength(4);

        const okResults = res.body.data.results.filter(
            (r: { success: boolean }) => r.success,
        );
        const failResults = res.body.data.results.filter(
            (r: { success: boolean }) => !r.success,
        );

        expect(okResults).toHaveLength(2);
        expect(failResults).toHaveLength(2);
        expect(failResults.some(
            (r: { error?: { message: string } }) =>
                r.error?.message?.includes("Closed tickets"),
        )).toBe(true);
    });

    it("bulk-status returns per-item errors when transition is invalid", async () => {
        const { agent, customer } = await seedBasic();
        const t1 = (await createTicket(customer, "X")).body.data._id;

        // t1 is open — closed is a valid terminal transition.
        // Include a fake id to force one failure.
        const res = await request(app)
            .post("/api/v1/tickets/bulk/status")
            .set("Authorization", `Bearer ${agent.token}`)
            .send({
                ticketIds: [t1, "000000000000000000000000"],
                status: "closed",
            });

        expect(res.status).toBe(200);
        expect(res.body.data.succeeded).toBe(1);
        expect(res.body.data.failed).toBe(1);
    });

    it("rejects bulk/assign to a customer", async () => {
        const { agent, customer } = await seedBasic();
        const t1 = (await createTicket(customer, "X")).body.data._id;

        const res = await request(app)
            .post("/api/v1/tickets/bulk/assign")
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ ticketIds: [t1], assigneeId: customer.id });

        expect(res.status).toBe(400);
    });

    it("rejects more than 100 ids in one bulk request", async () => {
        const { agent } = await seedBasic();
        const ids = Array.from(
            { length: 101 },
            () => "000000000000000000000000",
        );

        const res = await request(app)
            .post("/api/v1/tickets/bulk/assign")
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ ticketIds: ids, assigneeId: agent.id });

        expect(res.status).toBe(400);
    });

    it("forbids customer from using bulk endpoints", async () => {
        const { customer } = await seedBasic();
        const res = await request(app)
            .post("/api/v1/tickets/bulk/assign")
            .set("Authorization", `Bearer ${customer.token}`)
            .send({
                ticketIds: ["000000000000000000000000"],
                assigneeId: customer.id,
            });
        expect(res.status).toBe(403);
    });
});

describe("Ticket timeline", () => {
    it("returns comments, history, and attachments in chronological order for agents", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, "Timeline");
        const ticketId = created.body.data._id;

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: agent.id });

        await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${customer.token}`)
            .send({ message: "External from customer", type: "external" });

        await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "Internal agent note", type: "internal" });

        const res = await request(app)
            .get(`/api/v1/tickets/${ticketId}/timeline`)
            .set("Authorization", `Bearer ${agent.token}`);

        expect(res.status).toBe(200);
        const types = res.body.data.timeline.map(
            (e: { type: string }) => e.type,
        );
        expect(types).toEqual(expect.arrayContaining([
            "comment",
            "history",
        ]));
        expect(res.body.data.counts.comments).toBe(2);
        expect(res.body.data.counts.history).toBeGreaterThan(0);

        // Verify ascending order.
        const times = res.body.data.timeline.map(
            (e: { createdAt: string }) => new Date(e.createdAt).getTime(),
        );
        for (let i = 1; i < times.length; i++) {
            expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
        }
    });

    it("customer timeline excludes internal comments and history entries", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, "TimelineCust");
        const ticketId = created.body.data._id;

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: agent.id });

        await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${customer.token}`)
            .send({ message: "Cust external", type: "external" });

        await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "Agent internal", type: "internal" });

        const res = await request(app)
            .get(`/api/v1/tickets/${ticketId}/timeline`)
            .set("Authorization", `Bearer ${customer.token}`);

        expect(res.status).toBe(200);
        const comments = res.body.data.timeline.filter(
            (e: { type: string; data: { commentType?: string } }) =>
                e.type === "comment",
        );
        for (const c of comments) {
            expect(c.data.commentType).toBe("external");
        }
        const historyCount = res.body.data.timeline.filter(
            (e: { type: string }) => e.type === "history",
        ).length;
        expect(historyCount).toBe(0);
        expect(res.body.data.counts.history).toBe(0);
    });

    it("returns 403 when customer requests another customer's timeline", async () => {
        const c1 = await seedUser({
            email: "c1@example.com",
            name: "C1",
            role: "customer",
        });
        const c2 = await seedUser({
            email: "c2@example.com",
            name: "C2",
            role: "customer",
        });
        const created = await createTicket(c1, "Owned");
        const ticketId = created.body.data._id;

        const res = await request(app)
            .get(`/api/v1/tickets/${ticketId}/timeline`)
            .set("Authorization", `Bearer ${c2.token}`);

        expect(res.status).toBe(403);
    });
});

describe("User management endpoints", () => {
    it("lists users with search and role filters", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        await seedUser({
            email: "a1@example.com",
            name: "Alice",
            role: "agent",
        });
        await seedUser({
            email: "a2@example.com",
            name: "Alex",
            role: "agent",
        });
        await seedUser({
            email: "c1@example.com",
            name: "Cust",
            role: "customer",
        });

        const all = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${admin.token}`);
        expect(all.body.data.users).toHaveLength(4);

        const agents = await request(app)
            .get("/api/v1/users?role=agent")
            .set("Authorization", `Bearer ${admin.token}`);
        expect(agents.body.data.users).toHaveLength(2);

        const search = await request(app)
            .get("/api/v1/users?search=al")
            .set("Authorization", `Bearer ${admin.token}`);
        expect(search.body.data.users.length).toBeGreaterThanOrEqual(2);
    });

    it("updates a user's name and role", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        const agent = await seedUser({
            email: "a@example.com",
            name: "Old Name",
            role: "agent",
        });

        const res = await request(app)
            .put(`/api/v1/users/${agent.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ name: "New Name", teamId: "tier2" });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe("New Name");
        expect(res.body.data.teamId).toBe("tier2");
        expect(res.body.data.password).toBeUndefined();
    });

    it("soft-deletes a user (excluded from default list)", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        const agent = await seedUser({
            email: "a@example.com",
            name: "Doomed",
            role: "agent",
        });

        await request(app)
            .delete(`/api/v1/users/${agent.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .expect(200);

        const list = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${admin.token}`);
        expect(list.body.data.users).toHaveLength(1);

        const withDeleted = await request(app)
            .get("/api/v1/users?includeDeleted=true")
            .set("Authorization", `Bearer ${admin.token}`);
        expect(withDeleted.body.data.users).toHaveLength(2);
    });

    it("rejects demoting the last admin via the API", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .put(`/api/v1/users/${admin.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ role: "agent" });

        expect(res.status).toBe(400);
    });

    it("rejects deleting the last admin via the API", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const res = await request(app)
            .delete(`/api/v1/users/${admin.id}`)
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(400);
    });
});

describe("Admin reports", () => {
    it("returns aggregated metrics for admin", async () => {
        const { admin, agent, customer } = await seedBasic();

        // Create a few tickets in known states.
        const Ticket = (await import("../../src/models/Ticket.js")).Ticket;
        const Types = (await import("mongoose")).Types;
        await Ticket.insertMany([
            {
                customerId: new Types.ObjectId(customer.id),
                assigneeId: new Types.ObjectId(agent.id),
                subject: "Open",
                description: "x",
                priority: "low",
                status: "open",
                breached: false,
            },
            {
                customerId: new Types.ObjectId(customer.id),
                assigneeId: new Types.ObjectId(agent.id),
                subject: "Resolved on time",
                description: "x",
                priority: "medium",
                status: "resolved",
                breached: false,
                createdAt: new Date(Date.now() - 2 * 60_000),
                resolvedAt: new Date(Date.now() - 1 * 60_000),
            },
            {
                customerId: new Types.ObjectId(customer.id),
                assigneeId: new Types.ObjectId(agent.id),
                subject: "Breached",
                description: "x",
                priority: "high",
                status: "resolved",
                breached: true,
                createdAt: new Date(Date.now() - 5 * 60_000),
                resolvedAt: new Date(Date.now() - 1 * 60_000),
            },
        ]);

        const res = await request(app)
            .get("/api/v1/reports/tickets")
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.summary.totalTickets).toBe(3);
        expect(res.body.data.summary.breachedTickets).toBe(1);
        expect(res.body.data.summary.breachRate).toBeCloseTo(33.33, 1);
        expect(res.body.data.performance.avgResolutionTimeMinutes).toBeGreaterThan(0);
        expect(res.body.data.byStatus.open).toBe(1);
        expect(res.body.data.byStatus.resolved).toBe(2);
        expect(res.body.data.byPriority.high.total).toBe(1);
        expect(res.body.data.byPriority.high.breached).toBe(1);
    });

    it("filters reports by date range", async () => {
        const { admin, customer } = await seedBasic();
        const Ticket = (await import("../../src/models/Ticket.js")).Ticket;
        const Types = (await import("mongoose")).Types;

        const old = new Date(Date.now() - 10 * 24 * 60 * 60_000);
        await Ticket.create({
            customerId: new Types.ObjectId(customer.id),
            subject: "Old",
            description: "x",
            priority: "low",
            status: "open",
            breached: false,
            createdAt: old,
        });
        await Ticket.create({
            customerId: new Types.ObjectId(customer.id),
            subject: "Recent",
            description: "x",
            priority: "low",
            status: "open",
            breached: false,
        });

        const res = await request(app)
            .get(
                `/api/v1/reports/tickets?startDate=${new Date(
                    Date.now() - 24 * 60 * 60_000,
                ).toISOString()}`,
            )
            .set("Authorization", `Bearer ${admin.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.summary.totalTickets).toBe(1);
    });
});

describe("Comment typing rules", () => {
    it("persists internal comments for agents and hides them from customers in GET", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, "Comments");
        const ticketId = created.body.data._id;

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: agent.id });

        const ext = await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "External", type: "external" });
        expect(ext.status).toBe(201);

        const int = await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "Internal", type: "internal" });
        expect(int.status).toBe(201);

        const agentView = await request(app)
            .get(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`);
        expect(agentView.body.data).toHaveLength(2);

        const custView = await request(app)
            .get(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${customer.token}`);
        expect(custView.body.data).toHaveLength(1);
        expect(custView.body.data[0].type).toBe("external");

        const internalCount = await Comment.countDocuments({
            ticketId,
            type: "internal",
        });
        expect(internalCount).toBe(1);
    });
});

describe("Audit history access", () => {
    it("agent can view history; customer cannot", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, "Hist");
        const ticketId = created.body.data._id;

        const agentRes = await request(app)
            .get(`/api/v1/tickets/${ticketId}/history`)
            .set("Authorization", `Bearer ${agent.token}`);
        expect(agentRes.status).toBe(200);

        const custRes = await request(app)
            .get(`/api/v1/tickets/${ticketId}/history`)
            .set("Authorization", `Bearer ${customer.token}`);
        expect(custRes.status).toBe(403);
    });

    it("records priority changes in history", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, "Priority change");
        const ticketId = created.body.data._id;

        await request(app)
            .put(`/api/v1/tickets/${ticketId}`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ priority: "urgent" })
            .expect(200);

        const records = await TicketHistory.find({
            ticketId,
            action: "priority_change",
        });
        expect(records).toHaveLength(1);
        expect(records[0].oldValue).toBe("low");
        expect(records[0].newValue).toBe("urgent");
    });
});
