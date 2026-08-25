import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import { SLA } from "../models/SLA.js";
import { Category } from "../models/Category.js";
import { Ticket, TicketPriority, TicketStatus } from "../models/Ticket.js";
import { Comment } from "../models/Comment.js";
import { TicketHistory } from "../models/TicketHistory.js";
import { Attachment } from "../models/Attachment.js";
import { logger } from "../logger/logger.js";

const SALT_ROUNDS = 12;

const SLA_SEED: Array<{
    priority: "low" | "medium" | "high" | "urgent";
    responseTarget: number;
    resolutionTarget: number;
}> = [
        { priority: "low", responseTarget: 240, resolutionTarget: 2880 },
        { priority: "medium", responseTarget: 120, resolutionTarget: 960 },
        { priority: "high", responseTarget: 60, resolutionTarget: 480 },
        { priority: "urgent", responseTarget: 30, resolutionTarget: 240 },
    ];

const CATEGORY_SEED: Array<{ name: string; status: "active" | "inactive" }> = [
    { name: "Billing", status: "active" },
    { name: "Technical", status: "active" },
    { name: "Account", status: "active" },
    { name: "General", status: "active" },
];

interface UserSeed {
    email: string;
    name: string;
    password: string;
    role: "customer" | "agent" | "admin";
    teamId?: string;
}

const USER_SEED: UserSeed[] = [
    {
        email: "admin@helpdesk.local",
        name: "Ada Admin",
        password: "Admin@1234",
        role: "admin",
        teamId: "ops",
    },
    {
        email: "agent.alice@helpdesk.local",
        name: "Alice Agent",
        password: "Agent@1234",
        role: "agent",
        teamId: "support-tier1",
    },
    {
        email: "agent.bob@helpdesk.local",
        name: "Bob Agent",
        password: "Agent@1234",
        role: "agent",
        teamId: "support-tier2",
    },
    {
        email: "customer.carol@helpdesk.local",
        name: "Carol Customer",
        password: "Customer@1234",
        role: "customer",
    },
    {
        email: "customer.dave@helpdesk.local",
        name: "Dave Customer",
        password: "Customer@1234",
        role: "customer",
    },
];

const MINUTE_MS = 60_000;

const addMinutes = (base: Date, minutes: number): Date =>
    new Date(base.getTime() + minutes * MINUTE_MS);

const seedSlas = async (): Promise<void> => {
    for (const sla of SLA_SEED) {
        await SLA.findOneAndUpdate(
            { priority: sla.priority },
            { $set: sla },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
    }
    logger.info(`Seeded ${SLA_SEED.length} SLA policies`);
};

const seedCategories = async (): Promise<Map<string, Types.ObjectId>> => {
    const map = new Map<string, Types.ObjectId>();
    for (const c of CATEGORY_SEED) {
        const doc = await Category.findOneAndUpdate(
            { name: c.name },
            { $set: c },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        map.set(c.name, doc!._id as Types.ObjectId);
    }
    logger.info(`Seeded ${CATEGORY_SEED.length} categories`);
    return map;
};

const seedUsers = async (): Promise<Map<string, Types.ObjectId>> => {
    const map = new Map<string, Types.ObjectId>();
    for (const u of USER_SEED) {
        const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
        const doc = await User.findOneAndUpdate(
            { email: u.email },
            {
                $set: {
                    name: u.name,
                    password: hashed,
                    role: u.role,
                    teamId: u.teamId ?? null,
                    deleted: false,
                    deletedAt: null,
                },
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        map.set(u.email, doc!._id as Types.ObjectId);
    }
    logger.info(`Seeded ${USER_SEED.length} users`);
    return map;
};

interface TicketSeed {
    subject: string;
    description: string;
    customerEmail: string;
    categoryName: string;
    priority: TicketPriority;
    status: TicketStatus;
    assigneeEmail?: string;
    hoursAgoCreated: number;
    minutesToFirstResponse?: number;
    minutesToResolved?: number;
    minutesToClosed?: number;
    breached?: boolean;
    externalComments?: string[];
    internalNotes?: string[];
}

const TICKET_SEED: TicketSeed[] = [
    {
        subject: "Cannot log in to my account",
        description:
            "I have been trying to log in for the last hour but the page keeps timing out.",
        customerEmail: "customer.carol@helpdesk.local",
        categoryName: "Account",
        priority: TicketPriority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        assigneeEmail: "agent.alice@helpdesk.local",
        hoursAgoCreated: 1,
        minutesToFirstResponse: 15,
        breached: false,
        externalComments: [
            "Customer: Still cannot log in. Cleared browser cache.",
            "Agent: Reset your password using the forgot-password flow.",
        ],
        internalNotes: ["Agent: Likely cookie/session issue. Awaiting confirmation."],
    },
    {
        subject: "Invoice shows wrong total",
        description: "The invoice I received this morning is missing a discount.",
        customerEmail: "customer.dave@helpdesk.local",
        categoryName: "Billing",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.ASSIGNED,
        assigneeEmail: "agent.bob@helpdesk.local",
        hoursAgoCreated: 2,
        minutesToFirstResponse: 30,
        breached: false,
        externalComments: ["Customer: Attaching the invoice PDF."],
    },
    {
        subject: "Feature request: dark mode",
        description: "Would love a dark mode option for the dashboard.",
        customerEmail: "customer.carol@helpdesk.local",
        categoryName: "General",
        priority: TicketPriority.LOW,
        status: TicketStatus.OPEN,
        hoursAgoCreated: 0.5,
        breached: false,
    },
    {
        subject: "API returns 500 on POST /orders",
        description:
            "Started seeing 500s from POST /orders since this morning. No request id captured.",
        customerEmail: "customer.dave@helpdesk.local",
        categoryName: "Technical",
        priority: TicketPriority.URGENT,
        status: TicketStatus.RESOLVED,
        assigneeEmail: "agent.alice@helpdesk.local",
        hoursAgoCreated: 72,
        minutesToFirstResponse: 10,
        minutesToResolved: 60,
        breached: false,
        externalComments: [
            "Customer: Hitting this from production traffic.",
            "Agent: Deployed hotfix in v2.4.1. Please retry.",
        ],
        internalNotes: [
            "Agent: Root cause was null shipping address. Fixed in PR #421.",
        ],
    },
    {
        subject: "Refund for duplicate charge",
        description:
            "I see two charges on my card for the same subscription this month.",
        customerEmail: "customer.dave@helpdesk.local",
        categoryName: "Billing",
        priority: TicketPriority.HIGH,
        status: TicketStatus.CLOSED,
        assigneeEmail: "agent.bob@helpdesk.local",
        hoursAgoCreated: 120,
        minutesToFirstResponse: 20,
        minutesToResolved: 180,
        minutesToClosed: 1440,
        breached: false,
        externalComments: [
            "Agent: Refund processed. Please allow 5 business days.",
        ],
    },
    {
        subject: "How do I change my plan?",
        description: "I want to upgrade to the team plan.",
        customerEmail: "customer.carol@helpdesk.local",
        categoryName: "Account",
        priority: TicketPriority.LOW,
        status: TicketStatus.OPEN,
        hoursAgoCreated: 1.5,
        breached: false,
    },
    {
        subject: "Mobile app crashes on startup (iOS)",
        description:
            "After updating to v3.1.0 the app crashes immediately on launch.",
        customerEmail: "customer.dave@helpdesk.local",
        categoryName: "Technical",
        priority: TicketPriority.URGENT,
        status: TicketStatus.IN_PROGRESS,
        assigneeEmail: "agent.alice@helpdesk.local",
        hoursAgoCreated: 0.5,
        minutesToFirstResponse: 10,
        breached: false,
        externalComments: [
            "Customer: Happens on iPhone 14, iOS 17.",
            "Agent: Replicated on TestFlight build. Engineering is investigating.",
        ],
        internalNotes: [
            "Agent: Looks like a Crashlytics regression after v3.1.0 release.",
        ],
    },
    {
        subject: "Need W-9 form for accounting",
        description:
            "Could you email our accounts payable team the W-9 form for 2026?",
        customerEmail: "customer.carol@helpdesk.local",
        categoryName: "Billing",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.RESOLVED,
        assigneeEmail: "agent.bob@helpdesk.local",
        hoursAgoCreated: 48,
        minutesToFirstResponse: 30,
        minutesToResolved: 240,
        breached: false,
        externalComments: ["Agent: Sent W-9 to your billing email."],
    },
    {
        subject: "Old ticket for breach demo",
        description:
            "Resolved long ago but the response time exceeded SLA for testing.",
        customerEmail: "customer.dave@helpdesk.local",
        categoryName: "General",
        priority: TicketPriority.LOW,
        status: TicketStatus.RESOLVED,
        assigneeEmail: "agent.alice@helpdesk.local",
        hoursAgoCreated: 240,
        minutesToFirstResponse: 480,
        minutesToResolved: 3600,
        breached: true,
        externalComments: [],
        internalNotes: ["Agent: Marked as breached to populate reports."],
    },
    {
        subject: "Just confirming an SLA breach case",
        description:
            "This ticket should be flagged as breached in the SLA dashboard.",
        customerEmail: "customer.carol@helpdesk.local",
        categoryName: "General",
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        assigneeEmail: "agent.alice@helpdesk.local",
        hoursAgoCreated: 6,
        breached: true,
    },
];

const slaMinutes = (
    priority: TicketPriority,
): { response: number; resolution: number } => {
    const row = SLA_SEED.find((s) => s.priority === priority)!;
    return { response: row.responseTarget, resolution: row.resolutionTarget };
};

const seedTickets = async (
    users: Map<string, Types.ObjectId>,
    categories: Map<string, Types.ObjectId>,
): Promise<void> => {
    await Promise.all([
        Ticket.deleteMany({}),
        Comment.deleteMany({}),
        TicketHistory.deleteMany({}),
        Attachment.deleteMany({}),
    ]);

    const now = Date.now();

    for (const t of TICKET_SEED) {
        const customerId = users.get(t.customerEmail)!;
        const categoryId = categories.get(t.categoryName)!;
        const assigneeId = t.assigneeEmail
            ? users.get(t.assigneeEmail)
            : undefined;

        const createdAt = new Date(
            now - Math.round(t.hoursAgoCreated * 60 * MINUTE_MS),
        );
        const respondedAt =
            t.minutesToFirstResponse !== undefined
                ? addMinutes(createdAt, t.minutesToFirstResponse)
                : undefined;
        const resolvedAt =
            t.minutesToResolved !== undefined
                ? addMinutes(createdAt, t.minutesToResolved)
                : undefined;
        const closedAt =
            t.minutesToClosed !== undefined
                ? addMinutes(createdAt, t.minutesToClosed)
                : undefined;

        const { response, resolution } = slaMinutes(t.priority);
        const responseDueAt = addMinutes(createdAt, response);
        const resolutionDueAt = addMinutes(createdAt, resolution);

        const breached =
            t.breached === true ||
            (respondedAt !== undefined && respondedAt > responseDueAt) ||
            (resolvedAt !== undefined && resolvedAt > resolutionDueAt) ||
            (t.status !== TicketStatus.RESOLVED &&
                t.status !== TicketStatus.CLOSED &&
                new Date() > resolutionDueAt);

        const ticket = await Ticket.create({
            customerId,
            assigneeId: assigneeId ?? undefined,
            categoryId,
            priority: t.priority,
            status: t.status,
            subject: t.subject,
            description: t.description,
            responseDueAt,
            resolutionDueAt,
            respondedAt,
            resolvedAt,
            closedAt,
            breached,
            reopenedAt: undefined,
            createdAt,
            updatedAt: closedAt ?? resolvedAt ?? respondedAt ?? createdAt,
        });

        // History: creation
        await TicketHistory.create({
            ticketId: ticket._id,
            actorId: customerId,
            action: "other",
            oldValue: null,
            newValue: "Ticket created",
            createdAt,
        });

        if (assigneeId) {
            await TicketHistory.create({
                ticketId: ticket._id,
                actorId: assigneeId,
                action: "assign",
                oldValue: null,
                newValue: assigneeId.toString(),
                createdAt: respondedAt ?? addMinutes(createdAt, 5),
            });
        }

        if (t.status !== TicketStatus.OPEN) {
            await TicketHistory.create({
                ticketId: ticket._id,
                actorId: assigneeId ?? customerId,
                action:
                    t.status === TicketStatus.CLOSED
                        ? "close"
                        : "status_change",
                oldValue: TicketStatus.OPEN,
                newValue: t.status,
                createdAt: closedAt ?? resolvedAt ?? respondedAt ?? addMinutes(createdAt, 10),
            });
        }

        if (breached) {
            await TicketHistory.create({
                ticketId: ticket._id,
                actorId: assigneeId ?? customerId,
                action: "sla_breach",
                oldValue: "within_sla",
                newValue: "breached",
                createdAt: resolutionDueAt,
            });
        }

        // Comments — round-robin between customer and agent for variety.
        const externalLines = t.externalComments ?? [];
        const internalLines = t.internalNotes ?? [];

        const agentId = assigneeId ?? users.get("agent.alice@helpdesk.local")!;
        const authorCycle: Array<{
            authorId: Types.ObjectId;
            message: string;
            type: "external" | "internal";
        }> = [];

        for (let i = 0; i < externalLines.length; i++) {
            authorCycle.push({
                authorId: i % 2 === 0 ? customerId : agentId,
                message: externalLines[i],
                type: "external",
            });
        }
        for (const line of internalLines) {
            authorCycle.push({
                authorId: agentId,
                message: line,
                type: "internal",
            });
        }

        for (let i = 0; i < authorCycle.length; i++) {
            const commentTime = addMinutes(createdAt, 5 + i * 5);
            await Comment.create({
                ticketId: ticket._id,
                authorId: authorCycle[i].authorId,
                type: authorCycle[i].type,
                message: authorCycle[i].message,
                createdAt: commentTime,
                updatedAt: commentTime,
            });
        }

        // Attachment metadata for a couple of tickets (no real file).
        if (
            t.subject.includes("Invoice") ||
            t.subject.includes("duplicate charge")
        ) {
            await Attachment.create({
                ticketId: ticket._id,
                uploadedBy: customerId,
                fileName: "invoice.pdf",
                storageKey: `seed/${ticket._id.toString()}/invoice.pdf`,
                mimeType: "application/pdf",
                size: 12_345,
                createdAt,
                updatedAt: createdAt,
            });
        }
    }

    logger.info(`Seeded ${TICKET_SEED.length} tickets with comments/history`);
};

export const seedAll = async (): Promise<void> => {
    await seedSlas();
    const categories = await seedCategories();
    const users = await seedUsers();
    await seedTickets(users, categories);
    logger.info("Seed completed successfully");
};
