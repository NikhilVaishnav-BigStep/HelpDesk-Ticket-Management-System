import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { seedUser, authHeader } from "../helpers/auth.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe("Agent & Admin Queue RBAC Workflow (Cases 1-4)", () => {
    it("Case 1: Agent 1 claims an unassigned ticket -> hidden from Agent 2, visible to Agent 1 and Admin", async () => {
        const customer = await seedUser({ role: "customer", email: "cust1@example.com", name: "Cust 1" });
        const agent1 = await seedUser({ role: "agent", email: "agent1@example.com", name: "Agent 1" });
        const agent2 = await seedUser({ role: "agent", email: "agent2@example.com", name: "Agent 2" });
        const admin = await seedUser({ role: "admin", email: "admin1@example.com", name: "Admin 1" });

        // Customer creates ticket
        const created = await request(app)
            .post("/api/v1/tickets")
            .set(authHeader(customer.token))
            .send({ subject: "Case 1 Ticket", description: "Help needed" });
        expect(created.status).toBe(201);
        const ticketId = created.body.data._id;

        // Both agents see it in unassigned queue
        const unassignedAgent1 = await request(app)
            .get("/api/v1/tickets?assigneeId=unassigned")
            .set(authHeader(agent1.token));
        expect(unassignedAgent1.status).toBe(200);
        expect(unassignedAgent1.body.data.tickets.some((t: any) => t._id === ticketId)).toBe(true);

        const unassignedAgent2 = await request(app)
            .get("/api/v1/tickets?assigneeId=unassigned")
            .set(authHeader(agent2.token));
        expect(unassignedAgent2.status).toBe(200);
        expect(unassignedAgent2.body.data.tickets.some((t: any) => t._id === ticketId)).toBe(true);

        // Agent 1 claims ticket ("Assign to Me")
        const claimRes = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set(authHeader(agent1.token))
            .send({ assigneeId: agent1.id });
        expect(claimRes.status).toBe(200);

        // Agent 1 sees in assigned queue
        const agent1Assigned = await request(app)
            .get(`/api/v1/tickets?assigneeId=${agent1.id}`)
            .set(authHeader(agent1.token));
        expect(agent1Assigned.body.data.tickets.some((t: any) => t._id === ticketId)).toBe(true);

        // Agent 2 CANNOT see it in their assigned queue or default queue
        const agent2List = await request(app)
            .get("/api/v1/tickets")
            .set(authHeader(agent2.token));
        expect(agent2List.body.data.tickets.some((t: any) => t._id === ticketId)).toBe(false);

        // Agent 2 is forbidden from viewing detail directly
        const agent2Detail = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set(authHeader(agent2.token));
        expect(agent2Detail.status).toBe(403);

        // Admin sees it
        const adminDetail = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set(authHeader(admin.token));
        expect(adminDetail.status).toBe(200);
    });

    it("Case 2: Admin assigns an unassigned ticket to Agent 1 -> Agent 1 sees it, Agent 2 cannot", async () => {
        const customer = await seedUser({ role: "customer", email: "cust2@example.com", name: "Cust 2" });
        const agent1 = await seedUser({ role: "agent", email: "agent1b@example.com", name: "Agent 1b" });
        const agent2 = await seedUser({ role: "agent", email: "agent2b@example.com", name: "Agent 2b" });
        const admin = await seedUser({ role: "admin", email: "admin2@example.com", name: "Admin 2" });

        const created = await request(app)
            .post("/api/v1/tickets")
            .set(authHeader(customer.token))
            .send({ subject: "Case 2 Ticket", description: "Admin assigning" });
        const ticketId = created.body.data._id;

        // Admin assigns to Agent 1
        const assignRes = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set(authHeader(admin.token))
            .send({ assigneeId: agent1.id });
        expect(assignRes.status).toBe(200);

        // Agent 1 can view
        const agent1Detail = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set(authHeader(agent1.token));
        expect(agent1Detail.status).toBe(200);

        // Agent 2 gets 403 Forbidden
        const agent2Detail = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set(authHeader(agent2.token));
        expect(agent2Detail.status).toBe(403);
    });

    it("Case 3: Admin reassigns from Agent 1 to Agent 2 -> Agent 1 loses access, Agent 2 gains access", async () => {
        const customer = await seedUser({ role: "customer", email: "cust3@example.com", name: "Cust 3" });
        const agent1 = await seedUser({ role: "agent", email: "agent1c@example.com", name: "Agent 1c" });
        const agent2 = await seedUser({ role: "agent", email: "agent2c@example.com", name: "Agent 2c" });
        const admin = await seedUser({ role: "admin", email: "admin3@example.com", name: "Admin 3" });

        const created = await request(app)
            .post("/api/v1/tickets")
            .set(authHeader(customer.token))
            .send({ subject: "Case 3 Ticket", description: "Reassigning" });
        const ticketId = created.body.data._id;

        // Initially assigned to Agent 1
        await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set(authHeader(admin.token))
            .send({ assigneeId: agent1.id });

        // Admin reassigns to Agent 2
        const reassignRes = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set(authHeader(admin.token))
            .send({ assigneeId: agent2.id });
        expect(reassignRes.status).toBe(200);

        // Agent 1 is now forbidden
        const agent1Detail = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set(authHeader(agent1.token));
        expect(agent1Detail.status).toBe(403);

        // Agent 2 now has access
        const agent2Detail = await request(app)
            .get(`/api/v1/tickets/${ticketId}`)
            .set(authHeader(agent2.token));
        expect(agent2Detail.status).toBe(200);
    });

    it("Case 4: Unassigning a ticket resets status to open and shows in unassigned list for all agents", async () => {
        const customer = await seedUser({ role: "customer", email: "cust4@example.com", name: "Cust 4" });
        const agent1 = await seedUser({ role: "agent", email: "agent1d@example.com", name: "Agent 1d" });
        const agent2 = await seedUser({ role: "agent", email: "agent2d@example.com", name: "Agent 2d" });

        const created = await request(app)
            .post("/api/v1/tickets")
            .set(authHeader(customer.token))
            .send({ subject: "Case 4 Ticket", description: "Unassign testing" });
        const ticketId = created.body.data._id;

        // Agent 1 claims ticket
        await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set(authHeader(agent1.token))
            .send({ assigneeId: agent1.id });

        // Agent 1 unassigns the ticket ("Unassign Me")
        const unassignRes = await request(app)
            .put(`/api/v1/tickets/${ticketId}/assign`)
            .set(authHeader(agent1.token))
            .send({ assigneeId: "" });
        expect(unassignRes.status).toBe(200);
        expect(unassignRes.body.data.status).toBe("open");
        expect(unassignRes.body.data.assigneeId).toBeNull();

        // Both Agent 1 and Agent 2 now see it in Unassigned list
        const agent1Unassigned = await request(app)
            .get("/api/v1/tickets?assigneeId=unassigned")
            .set(authHeader(agent1.token));
        expect(agent1Unassigned.body.data.tickets.some((t: any) => t._id === ticketId)).toBe(true);

        const agent2Unassigned = await request(app)
            .get("/api/v1/tickets?assigneeId=unassigned")
            .set(authHeader(agent2.token));
        expect(agent2Unassigned.body.data.tickets.some((t: any) => t._id === ticketId)).toBe(true);
    });
});
