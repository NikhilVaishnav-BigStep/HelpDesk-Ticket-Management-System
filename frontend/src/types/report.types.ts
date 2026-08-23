import type { Priority, TicketStatus } from "./ticket.types";

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

export interface TicketReportSummary {
    totalTickets: number;
    openTickets: number;
    assignedTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    breachedTickets: number;
    breachRate: number;
}

export interface TicketReportPerformance {
    avgResponseTimeMinutes: number;
    avgResolutionTimeMinutes: number;
}

export interface TicketReport {
    summary: TicketReportSummary;
    performance: TicketReportPerformance;
    byPriority: Record<Priority, PriorityBucket>;
    byStatus: Record<TicketStatus, number>;
    byCategory: CategoryBucket[];
}
