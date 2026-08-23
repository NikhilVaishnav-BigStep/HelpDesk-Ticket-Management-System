import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";
import { SLA } from "../../src/models/SLA.js";
import { Ticket, TicketPriority, TicketStatus } from "../../src/models/Ticket.js";
import { TicketHistory } from "../../src/models/TicketHistory.js";
import { User } from "../../src/models/User.js";
import { Category } from "../../src/models/Category.js";
import { Types } from "mongoose";
import * as slaService from "../../src/services/sla.service.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe("computeSlaDueDates", () => {
    it("uses configured responseTarget and resolutionTarget when present", async () => {
        await SLA.create({
            priority: "high",
            responseTarget: 30,
            resolutionTarget: 240,
        });

        const from = new Date("2026-01-01T00:00:00.000Z");
        const result = await slaService.computeSlaDueDates("high", from);

        expect(result.responseDueAt.toISOString()).toBe(
            "2026-01-01T00:30:00.000Z",
        );
        expect(result.resolutionDueAt.toISOString()).toBe(
            "2026-01-01T04:00:00.000Z",
        );
    });

    it("falls back to defaults when no SLA document exists", async () => {
        const from = new Date("2026-01-01T00:00:00.000Z");
        const result = await slaService.computeSlaDueDates("urgent", from);

        expect(result.responseDueAt.toISOString()).toBe(
            "2026-01-01T00:15:00.000Z",
        );
        expect(result.resolutionDueAt.toISOString()).toBe(
            "2026-01-01T02:00:00.000Z",
        );
    });

    it("falls back to defaults when SLA doc has invalid numeric targets", async () => {
        await SLA.create({
            priority: "medium",
            responseTarget: undefined,
            resolutionTarget: undefined,
        });

        const from = new Date("2026-01-01T00:00:00.000Z");
        const result = await slaService.computeSlaDueDates("medium", from);

        expect(result.responseDueAt.toISOString()).toBe(
            "2026-01-01T01:00:00.000Z",
        );
        expect(result.resolutionDueAt.toISOString()).toBe(
            "2026-01-01T08:00:00.000Z",
        );
    });
});

describe("detectAndRecordBreach", () => {
    const buildTicket = async (
        overrides: Partial<{
            breached: boolean;
            resolvedAt: Date | null;
            closedAt: Date | null;
            respondedAt: Date | null;
            responseDueAt: Date;
            resolutionDueAt: Date;
        }> = {},
    ) => {
        return Ticket.create({
            customerId: new Types.ObjectId(),
            subject: "Test",
            description: "Desc",
            priority: TicketPriority.HIGH,
            status: TicketStatus.OPEN,
            responseDueAt: new Date(),
            resolutionDueAt: new Date(),
            breached: false,
            respondedAt: undefined,
            resolvedAt: undefined,
            closedAt: undefined,
            ...overrides,
        });
    };

    it("returns ticket unchanged when nothing is overdue", async () => {
        const future = new Date(Date.now() + 60 * 60_000);
        const ticket = await buildTicket({
            responseDueAt: future,
            resolutionDueAt: future,
        });

        const result = await slaService.detectAndRecordBreach(
            ticket,
            new Types.ObjectId().toString(),
        );

        expect(result.breached).toBe(false);
        const count = await TicketHistory.countDocuments({
            ticketId: ticket._id,
            action: "sla_breach",
        });
        expect(count).toBe(0);
    });

    it("flags breach and records history when resolution is overdue", async () => {
        const past = new Date(Date.now() - 60 * 60_000);
        const ticket = await buildTicket({
            responseDueAt: past,
            resolutionDueAt: past,
        });

        const result = await slaService.detectAndRecordBreach(
            ticket,
            new Types.ObjectId().toString(),
        );

        expect(result.breached).toBe(true);
        const records = await TicketHistory.find({
            ticketId: ticket._id,
            action: "sla_breach",
        });
        expect(records).toHaveLength(1);
        expect(records[0].oldValue).toBe("within_sla");
        expect(records[0].newValue).toBe("breached");
    });

    it("is idempotent: skips when already breached", async () => {
        const past = new Date(Date.now() - 60 * 60_000);
        const ticket = await buildTicket({
            breached: true,
            responseDueAt: past,
            resolutionDueAt: past,
        });

        await slaService.detectAndRecordBreach(
            ticket,
            new Types.ObjectId().toString(),
        );

        const count = await TicketHistory.countDocuments({
            ticketId: ticket._id,
            action: "sla_breach",
        });
        expect(count).toBe(0);
    });

    it("skips when ticket is resolved", async () => {
        const past = new Date(Date.now() - 60 * 60_000);
        const ticket = await buildTicket({
            resolvedAt: new Date(),
            responseDueAt: past,
            resolutionDueAt: past,
        });

        await slaService.detectAndRecordBreach(
            ticket,
            new Types.ObjectId().toString(),
        );

        const count = await TicketHistory.countDocuments({
            ticketId: ticket._id,
            action: "sla_breach",
        });
        expect(count).toBe(0);
    });
});

describe("getAllSLAPolicies", () => {
    it("returns defaults for priorities with no configured SLA", async () => {
        const result = await slaService.getAllSLAPolicies();
        expect(result).toHaveLength(4);
        const byPrio = Object.fromEntries(
            result.map((p: slaService.SlaPolicyView) => [p.priority, p]),
        );
        expect(byPrio.low.isCustomized).toBe(false);
        expect(byPrio.low.responseTarget).toBe(240);
        expect(byPrio.urgent.resolutionTarget).toBe(120);
    });

    it("marks priorities as customized when present", async () => {
        await SLA.create({
            priority: "high",
            responseTarget: 20,
            resolutionTarget: 60,
        });

        const result = await slaService.getAllSLAPolicies();
        const high = result.find(
            (p: slaService.SlaPolicyView) => p.priority === "high",
        );
        expect(high?.isCustomized).toBe(true);
        expect(high?.responseTarget).toBe(20);
        expect(high?.resolutionTarget).toBe(60);
    });
});
