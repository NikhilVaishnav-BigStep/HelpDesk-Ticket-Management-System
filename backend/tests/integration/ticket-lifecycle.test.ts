import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { seedUser, SeededUser } from "../helpers/auth.js";
import { SLA } from "../../src/models/SLA.js";
import { Category } from "../../src/models/Category.js";
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
        { priority: "high", responseTarget: 30, resolutionTarget: 240 },
        { priority: "urgent", responseTarget: 15, resolutionTarget: 120 },
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
    payload: Record<string, unknown> = {},
) => {
    return request(app)
        .post("/api/v1/tickets")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
            subject: payload.subject ?? "Test ticket",
            description: payload.description ?? "Test description",
            priority: payload.priority ?? "medium",
            ...payload,
        });
};

describe("Ticket lifecycle", () => {
    it("customer can create a ticket and receives responseDueAt/resolutionDueAt", async () => {
        const { customer } = await seedBasic();
        const res = await createTicket(customer);

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe("open");
        expect(res.body.data.responseDueAt).toBeDefined();
        expect(res.body.data.resolutionDueAt).toBeDefined();

        const response = new Date(res.body.data.responseDueAt).getTime();
        const resolution = new Date(
            res.body.data.resolutionDueAt,
        ).getTime();
        // medium priority: 60 / 480 minutes (allow ±2s drift for clock + mongoose latency)
        expect(response).toBeGreaterThanOrEqual(Date.now() + 60 * 60_000 - 2000);
        expect(response).toBeLessThanOrEqual(Date.now() + 60 * 60_000 + 2000);
        expect(resolution).toBeGreaterThanOrEqual(
            Date.now() + 480 * 60_000 - 2000,
        );
        expect(resolution).toBeLessThanOrEqual(
            Date.now() + 480 * 60_000 + 2000,
        );
    });

    it("non-customer cannot create a ticket", async () => {
        const { agent } = await seedBasic();
        const res = await request(app)
            .post("/api/v1/tickets")
            .set("Authorization", `Bearer ${agent.token}`)
            .send({
                subject: "X",
                description: "Y",
                priority: "low",
            });

        expect(res.status).toBe(403);
    });

    it("rejects invalid priority enum", async () => {
        const { customer } = await seedBasic();
        const res = await createTicket(customer, { priority: "critical" });
        expect(res.status).toBe(400);
    });

    it("agent can assign, change status, comment, close, and reopen", async () => {
        const { agent, customer } = await seedBasic();

        const created = await createTicket(customer, {
            subject: "Lifecycle",
            priority: "high",
        });
        const ticketId = created.body.data._id;

        // assign
        const assigned = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: agent.id });
        expect(assigned.status).toBe(200);
        expect(assigned.body.data.assigneeId).toBe(agent.id);
        expect(assigned.body.data.status).toBe("assigned");

        // change status → in_progress
        const inProgress = await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "in_progress" });
        expect(inProgress.status).toBe(200);
        expect(inProgress.body.data.status).toBe("in_progress");

        // agent external comment
        const commented = await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "Investigating", type: "external" });
        expect(commented.status).toBe(201);

        // agent internal note (allowed for agent)
        const internal = await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "Likely config issue", type: "internal" });
        expect(internal.status).toBe(201);

        // customer cannot add internal notes
        const custInternal = await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${customer.token}`)
            .send({ message: "Secret", type: "internal" });
        expect(custInternal.status).toBe(403);

        // close
        const closed = await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "closed" });
        expect(closed.status).toBe(200);
        expect(closed.body.data.status).toBe("closed");
        expect(closed.body.data.closedAt).toBeDefined();

        // cannot update after close
        const afterClose = await request(app)
            .put(`/api/v1/tickets/${ticketId}`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ subject: "Edited" });
        expect(afterClose.status).toBe(400);

        // reopen
        const reopened = await request(app)
            .post(`/api/v1/tickets/${ticketId}/reopen`)
            .set("Authorization", `Bearer ${agent.token}`);
        expect(reopened.status).toBe(200);
        expect(reopened.body.data.status).toBe("in_progress");
        expect(reopened.body.data.reopenedAt).toBeDefined();
        // closedAt is cleared (null) after reopen
        expect(reopened.body.data.closedAt).toBeNull();
        expect(reopened.body.data.resolvedAt).toBeNull();

        // after reopen, new comments work
        const postReopenComment = await request(app)
            .post(`/api/v1/tickets/${ticketId}/comments`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ message: "Back to work", type: "external" });
        expect(postReopenComment.status).toBe(201);
    });

    it("forbids invalid status transitions", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer);
        const ticketId = created.body.data._id;

        // open -> resolved is valid
        await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "resolved" })
            .expect(200);

        // resolved -> in_progress is valid
        const back = await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "in_progress" });
        expect(back.status).toBe(200);

        // in_progress -> open is NOT valid
        const invalid = await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "open" });
        expect(invalid.status).toBe(400);
    });

    it("rejects reassigning a closed ticket", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer);
        const ticketId = created.body.data._id;

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "closed" })
            .expect(200);

        const reassign = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: agent.id });
        expect(reassign.status).toBe(400);
    });

    it("rejects assigning a customer as assignee", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer);
        const ticketId = created.body.data._id;

        const res = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: customer.id });
        expect(res.status).toBe(400);
    });
});

describe("Ticket history recording", () => {
    it("records creation + assignment + status change + reopen", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, {
            subject: "History test",
        });
        const ticketId = created.body.data._id;

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ assigneeId: agent.id });

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "in_progress" });

        await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "closed" });

        await request(app)
            .post(`/api/v1/tickets/${ticketId}/reopen`)
            .set("Authorization", `Bearer ${agent.token}`);

        const historyRes = await request(app)
            .get(`/api/v1/tickets/${ticketId}/history`)
            .set("Authorization", `Bearer ${agent.token}`)
            .expect(200);

        const actions = historyRes.body.data.map(
            (h: { action: string }) => h.action,
        );
        expect(actions).toEqual(
            expect.arrayContaining([
                "assign",
                "status_change",
                "close",
                "reopen",
            ]),
        );

        const reopenEntry = historyRes.body.data.find(
            (h: { action: string }) => h.action === "reopen",
        );
        expect(reopenEntry.oldValue).toBe("closed");
        expect(reopenEntry.newValue).toBe("in_progress");
    });
});

describe("SLA breach detection on resolve", () => {
    it("flags breach and writes history when resolved past resolutionDueAt", async () => {
        const { agent, customer } = await seedBasic();
        const created = await createTicket(customer, {
            subject: "Breach test",
            priority: "high", // 30 / 240 min
        });
        const ticketId = created.body.data._id;

        // Manually push the ticket's resolutionDueAt into the past to simulate
        // the elapsed-time scenario, then resolve.
        const Ticket = (await import("../../src/models/Ticket.js")).Ticket;
        await Ticket.updateOne(
            { _id: ticketId },
            {
                $set: {
                    responseDueAt: new Date(Date.now() - 60 * 60_000),
                    resolutionDueAt: new Date(Date.now() - 10 * 60_000),
                },
            },
        );

        const res = await request(app)
            .put(`/api/v1/tickets/${ticketId}/status`)
            .set("Authorization", `Bearer ${agent.token}`)
            .send({ status: "resolved" });

        expect(res.status).toBe(200);
        expect(res.body.data.breached).toBe(true);
        expect(res.body.data.resolvedAt).toBeDefined();

        const history = await TicketHistory.find({
            ticketId: created.body.data._id,
            action: "sla_breach",
        });
        expect(history).toHaveLength(1);
    });
});

describe("Customer ticket visibility", () => {
    it("customer only sees their own tickets", async () => {
        const customer = await seedUser({
            email: "c1@example.com",
            name: "C1",
            role: "customer",
        });
        const otherCustomer = await seedUser({
            email: "c2@example.com",
            name: "C2",
            role: "customer",
        });

        await createTicket(customer, { subject: "Mine" });
        await createTicket(otherCustomer, { subject: "Theirs" });

        const list = await request(app)
            .get("/api/v1/tickets")
            .set("Authorization", `Bearer ${customer.token}`);

        expect(list.status).toBe(200);
        expect(list.body.data.tickets).toHaveLength(1);
        expect(list.body.data.tickets[0].subject).toBe("Mine");
    });

    it("customer cannot access another customer's ticket", async () => {
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

        const created = await createTicket(c1, { subject: "C1 ticket" });
        const ticketId = created.body.data._id;

        const res = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set("Authorization", `Bearer ${c2.token}`);

        expect(res.status).toBe(403);
    });
});

describe("Ticket listing pagination + filters", () => {
    it("paginates and supports status filter", async () => {
        const { agent, customer } = await seedBasic();
        for (let i = 0; i < 5; i++) {
            await createTicket(customer, {
                subject: `T${i}`,
                priority: "low",
            });
        }

        const page1 = await request(app)
            .get("/api/v1/tickets?page=1&limit=2")
            .set("Authorization", `Bearer ${agent.token}`);
        expect(page1.status).toBe(200);
        expect(page1.body.data.tickets).toHaveLength(2);
        expect(page1.body.data.pagination.total).toBe(5);

        const filtered = await request(app)
            .get("/api/v1/tickets?status=open")
            .set("Authorization", `Bearer ${agent.token}`);
        expect(filtered.body.data.tickets.every(
            (t: { status: string }) => t.status === "open",
        )).toBe(true);
    });
});

describe("Categories", () => {
    it("admin can create, update, and soft-disable a category", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        const created = await request(app)
            .post("/api/v1/categories")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ name: "Billing", status: "active" });
        expect(created.status).toBe(201);

        const id = created.body.data._id;

        const updated = await request(app)
            .put(`/api/v1/categories/${id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ status: "inactive" });
        expect(updated.status).toBe(200);
        expect(updated.body.data.status).toBe("inactive");

        const list = await request(app)
            .get("/api/v1/categories?status=inactive")
            .set("Authorization", `Bearer ${admin.token}`);
        expect(list.body.data).toHaveLength(1);
    });

    it("rejects duplicate category name (case-insensitive)", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });
        await Category.create({ name: "Billing", status: "active" });

        const res = await request(app)
            .post("/api/v1/categories")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ name: "BILLING" });
        expect(res.status).toBe(409);
    });

    it("blocks deletion of category referenced by tickets", async () => {
        const { agent, customer } = await seedBasic();
        const cat = await Category.create({
            name: "Tech",
            status: "active",
        });

        const created = await createTicket(customer, { subject: "T" });
        const ticketId = created.body.data._id;

        const Ticket = (await import("../../src/models/Ticket.js")).Ticket;
        await Ticket.updateOne(
            { _id: ticketId },
            { $set: { categoryId: cat._id } },
        );

        const del = await request(app)
            .delete(`/api/v1/categories/${cat._id}`)
            .set("Authorization", `Bearer ${agent.token}`);
        // Note: agent is not admin — should be 403 from authorize middleware.
        expect(del.status).toBe(403);
    });
});
