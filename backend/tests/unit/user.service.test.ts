import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { seedUser } from "../helpers/auth.js";
import { User } from "../../src/models/User.js";
import { Ticket, TicketPriority, TicketStatus } from "../../src/models/Ticket.js";
import { Types } from "mongoose";
import * as userService from "../../src/services/user.service.js";
import { AppException } from "../../src/exceptions/AppException.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe("user.service.updateUser last-admin guard", () => {
    it("rejects demoting the last active admin", async () => {
        const admin = await seedUser({
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
        });

        await expect(
            userService.updateUser(admin.id, { role: "agent" }),
        ).rejects.toBeInstanceOf(AppException);
        await expect(
            userService.updateUser(admin.id, { role: "agent" }),
        ).rejects.toMatchObject({
            message: "Cannot demote the last remaining admin",
            statusCode: 400,
        });

        const after = await User.findById(admin.id);
        expect(after?.role).toBe("admin");
    });

    it("allows demoting an admin when others remain", async () => {
        const admin1 = await seedUser({
            email: "a1@example.com",
            name: "A1",
            role: "admin",
        });
        await seedUser({
            email: "a2@example.com",
            name: "A2",
            role: "admin",
        });

        await userService.updateUser(admin1.id, { role: "agent" });

        const after = await User.findById(admin1.id);
        expect(after?.role).toBe("agent");
    });

    it("rejects updating a soft-deleted user", async () => {
        const agent = await seedUser({
            email: "del@example.com",
            name: "Del",
            role: "agent",
        });
        await User.updateOne(
            { _id: agent.id },
            { $set: { deleted: true, deletedAt: new Date() } },
        );

        await expect(
            userService.updateUser(agent.id, { name: "New" }),
        ).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it("rejects invalid ObjectId with 400", async () => {
        await expect(
            userService.updateUser("not-an-objectid", { name: "X" }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });
});

describe("user.service.softDeleteUser guards", () => {
    it("rejects deleting the last active admin", async () => {
        const admin = await seedUser({
            email: "solo@example.com",
            name: "Solo",
            role: "admin",
        });

        await expect(userService.softDeleteUser(admin.id)).rejects.toMatchObject(
            {
                message: "Cannot delete the last remaining admin",
                statusCode: 400,
            },
        );
    });

    it("rejects deleting a user referenced by active tickets", async () => {
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
        await Ticket.create({
            customerId: new Types.ObjectId(customer.id),
            assigneeId: new Types.ObjectId(agent.id),
            subject: "Open",
            description: "Open ticket",
            priority: TicketPriority.LOW,
            status: TicketStatus.OPEN,
        });

        await expect(
            userService.softDeleteUser(agent.id),
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it("soft-deletes when guards pass", async () => {
        const agent = await seedUser({
            email: "agent2@example.com",
            name: "Agent2",
            role: "agent",
        });
        await seedUser({
            email: "a@example.com",
            name: "A",
            role: "admin",
        });

        await userService.softDeleteUser(agent.id);

        const after = await User.findById(agent.id);
        expect(after?.deleted).toBe(true);
        expect(after?.deletedAt).toBeInstanceOf(Date);
    });
});
