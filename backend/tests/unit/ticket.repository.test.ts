import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { Ticket, TicketPriority, TicketStatus } from "../../src/models/Ticket.js";
import { findTickets } from "../../src/repositories/ticket.repository.js";
import { Types } from "mongoose";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const seedTickets = async () => {
    const customer = new Types.ObjectId();
    await Ticket.insertMany([
        {
            customerId: customer,
            subject: "Cannot log in",
            description: "Login page is broken",
            priority: TicketPriority.HIGH,
            status: TicketStatus.OPEN,
        },
        {
            customerId: customer,
            subject: "Refund request",
            description: "Need money back (urgent)",
            priority: TicketPriority.MEDIUM,
            status: TicketStatus.OPEN,
        },
        {
            customerId: customer,
            subject: "Feature: dark mode",
            description: "Please add dark mode",
            priority: TicketPriority.LOW,
            status: TicketStatus.OPEN,
        },
    ]);
};

describe("findTickets search (regex escape)", () => {
    it("finds matches by substring in subject or description", async () => {
        await seedTickets();
        const { tickets } = await findTickets(
            { search: "login" },
            0,
            10,
        );
        expect(tickets).toHaveLength(1);
        expect(tickets[0].subject).toBe("Cannot log in");
    });

    it("escapes regex special characters safely", async () => {
        await seedTickets();
        // "money back (urgent)" contains parens — without escaping, the regex
        // would be unbalanced. We expect to find the ticket as a literal substring.
        const { tickets } = await findTickets(
            { search: "(urgent)" },
            0,
            10,
        );
        expect(tickets).toHaveLength(1);
        expect(tickets[0].subject).toBe("Refund request");
    });

    it("escapes dot characters so they match literally", async () => {
        const customer = new Types.ObjectId();
        await Ticket.create({
            customerId: customer,
            subject: "API v2.0 broken",
            description: "Anything",
            priority: TicketPriority.HIGH,
            status: TicketStatus.OPEN,
        });

        const { tickets } = await findTickets(
            { search: "v2.0" },
            0,
            10,
        );
        expect(tickets).toHaveLength(1);
    });

    it("returns empty when no match", async () => {
        await seedTickets();
        const { tickets } = await findTickets(
            { search: "no-such-text" },
            0,
            10,
        );
        expect(tickets).toHaveLength(0);
    });

    it("applies sortBy + order correctly", async () => {
        await seedTickets();
        // MongoDB sorts strings alphabetically (h < l < m).
        const { tickets: asc } = await findTickets(
            {
                sortBy: "priority",
                order: "asc",
            },
            0,
            10,
        );
        const { tickets: desc } = await findTickets(
            {
                sortBy: "priority",
                order: "desc",
            },
            0,
            10,
        );
        expect(asc[0].priority).toBe("high");
        expect(desc[0].priority).toBe("medium");
    });
});
