import { Types } from "mongoose";
import { Ticket, TicketPriority, TicketStatus } from "../models/Ticket.js";
import { Category } from "../models/Category.js";

export interface TicketReportFilters {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
}

export interface PriorityBucket {
    total: number;
    breached: number;
    breachRate: number;
}

export interface CategoryBucket {
    categoryId: string | null;
    categoryName: string;
    total: number;
    breached: number;
}

export interface TicketReport {
    summary: {
        totalTickets: number;
        openTickets: number;
        assignedTickets: number;
        inProgressTickets: number;
        resolvedTickets: number;
        closedTickets: number;
        breachedTickets: number;
        breachRate: number;
    };
    performance: {
        avgResponseTimeMinutes: number;
        avgResolutionTimeMinutes: number;
    };
    byPriority: Record<TicketPriority, PriorityBucket>;
    byStatus: Record<TicketStatus, number>;
    byCategory: CategoryBucket[];
}

const ALL_PRIORITIES = Object.values(TicketPriority) as TicketPriority[];
const ALL_STATUSES = Object.values(TicketStatus) as TicketStatus[];

const round = (n: number, digits = 2): number => {
    const f = Math.pow(10, digits);
    return Math.round(n * f) / f;
};

const buildMatchStage = (
    filters: TicketReportFilters,
): Record<string, unknown> => {
    const match: Record<string, unknown> = {};

    if (filters.startDate || filters.endDate) {
        const range: Record<string, Date> = {};
        if (filters.startDate) {
            range.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            range.$lte = new Date(filters.endDate);
        }
        match.createdAt = range;
    }

    if (filters.categoryId) {
        match.categoryId = new Types.ObjectId(filters.categoryId);
    }

    return match;
};

export const generateTicketReport = async (
    filters: TicketReportFilters,
): Promise<TicketReport> => {
    const match = buildMatchStage(filters);

    const basePipeline = Object.keys(match).length > 0
        ? [{ $match: match }]
        : [];

    const summaryResult = await Ticket.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                openTickets: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TicketStatus.OPEN] }, 1, 0],
                    },
                },
                assignedTickets: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", TicketStatus.ASSIGNED] },
                            1,
                            0,
                        ],
                    },
                },
                inProgressTickets: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", TicketStatus.IN_PROGRESS] },
                            1,
                            0,
                        ],
                    },
                },
                resolvedTickets: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", TicketStatus.RESOLVED] },
                            1,
                            0,
                        ],
                    },
                },
                closedTickets: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TicketStatus.CLOSED] }, 1, 0],
                    },
                },
                breachedTickets: {
                    $sum: {
                        $cond: [{ $eq: ["$breached", true] }, 1, 0],
                    },
                },
                avgResponseTimeMs: {
                    $avg: {
                        $cond: [
                            { $ne: ["$respondedAt", null] },
                            {
                                $subtract: ["$respondedAt", "$createdAt"],
                            },
                            null,
                        ],
                    },
                },
                avgResolutionTimeMs: {
                    $avg: {
                        $cond: [
                            { $ne: ["$resolvedAt", null] },
                            {
                                $subtract: ["$resolvedAt", "$createdAt"],
                            },
                            null,
                        ],
                    },
                },
            },
        },
    ]);

    const summaryRow = summaryResult[0] ?? {
        totalTickets: 0,
        openTickets: 0,
        assignedTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        breachedTickets: 0,
        avgResponseTimeMs: null,
        avgResolutionTimeMs: null,
    };

    const totalTickets = summaryRow.totalTickets;
    const breachRate =
        totalTickets > 0
            ? round((summaryRow.breachedTickets / totalTickets) * 100)
            : 0;

    const avgResponseTimeMinutes =
        summaryRow.avgResponseTimeMs !== null &&
        summaryRow.avgResponseTimeMs !== undefined
            ? round(summaryRow.avgResponseTimeMs / 60_000)
            : 0;
    const avgResolutionTimeMinutes =
        summaryRow.avgResolutionTimeMs !== null &&
        summaryRow.avgResolutionTimeMs !== undefined
            ? round(summaryRow.avgResolutionTimeMs / 60_000)
            : 0;

    const priorityResult = await Ticket.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: "$priority",
                total: { $sum: 1 },
                breached: {
                    $sum: { $cond: [{ $eq: ["$breached", true] }, 1, 0] },
                },
            },
        },
    ]);

    const byPriority = ALL_PRIORITIES.reduce<
        Record<TicketPriority, PriorityBucket>
    >((acc, p) => {
        acc[p] = { total: 0, breached: 0, breachRate: 0 };
        return acc;
    }, {} as Record<TicketPriority, PriorityBucket>);

    for (const row of priorityResult) {
        const priority = row._id as TicketPriority;
        const total = row.total as number;
        const breached = row.breached as number;
        byPriority[priority] = {
            total,
            breached,
            breachRate: total > 0 ? round((breached / total) * 100) : 0,
        };
    }

    const statusResult = await Ticket.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    const byStatus = ALL_STATUSES.reduce<Record<TicketStatus, number>>(
        (acc, s) => {
            acc[s] = 0;
            return acc;
        },
        {} as Record<TicketStatus, number>,
    );

    for (const row of statusResult) {
        byStatus[row._id as TicketStatus] = row.count as number;
    }

    const categoryPipelineResult = await Ticket.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: "$categoryId",
                total: { $sum: 1 },
                breached: {
                    $sum: { $cond: [{ $eq: ["$breached", true] }, 1, 0] },
                },
            },
        },
        { $sort: { total: -1 } },
    ]);

    const uncategorizedIds = categoryPipelineResult
        .map((r) => r._id)
        .filter((id): id is Types.ObjectId => id !== null);

    const categories = uncategorizedIds.length
        ? await Category.find({
              _id: { $in: uncategorizedIds },
          })
              .select("_id name")
              .lean()
        : [];

    const categoryNameById = new Map<string, string>(
        categories.map((c) => [c._id.toString(), c.name]),
    );

    const byCategory: CategoryBucket[] = categoryPipelineResult.map((row) => {
        const id = row._id as Types.ObjectId | null;
        return {
            categoryId: id ? id.toString() : null,
            categoryName: id
                ? categoryNameById.get(id.toString()) ?? "Unknown"
                : "Uncategorized",
            total: row.total as number,
            breached: row.breached as number,
        };
    });

    return {
        summary: {
            totalTickets,
            openTickets: summaryRow.openTickets,
            assignedTickets: summaryRow.assignedTickets,
            inProgressTickets: summaryRow.inProgressTickets,
            resolvedTickets: summaryRow.resolvedTickets,
            closedTickets: summaryRow.closedTickets,
            breachedTickets: summaryRow.breachedTickets,
            breachRate,
        },
        performance: {
            avgResponseTimeMinutes,
            avgResolutionTimeMinutes,
        },
        byPriority,
        byStatus,
        byCategory,
    };
};
