export type Priority = "low" | "medium" | "high" | "urgent";

export type TicketStatus =
    | "open"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "closed";

export type CommentType = "external" | "internal";

export type HistoryAction =
    | "status_change"
    | "assign"
    | "priority_change"
    | "comment"
    | "reopen"
    | "close"
    | "sla_breach"
    | "other";

export interface Ticket {
    _id: string;
    customerId: string;
    assigneeId: string | null;
    categoryId: string | null;
    priority: Priority;
    status: TicketStatus;
    subject: string;
    description: string;
    responseDueAt: string | null;
    resolutionDueAt: string | null;
    respondedAt: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
    breached: boolean;
    reopenedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    _id: string;
    ticketId: string;
    authorId: string;
    type: CommentType;
    message: string;
    createdAt: string;
    updatedAt: string;
}

export interface Attachment {
    _id: string;
    ticketId: string;
    uploadedBy: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export interface TicketHistory {
    _id: string;
    ticketId: string;
    actorId: string;
    action: HistoryAction;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
}

export type TimelineEntryType = "comment" | "history" | "attachment";

export interface TimelineEntry {
    id: string;
    type: TimelineEntryType;
    createdAt: string;
    actor: object | null;
    data: object;
}

export interface TicketTimeline {
    ticket: Ticket;
    timeline: TimelineEntry[];
    counts: object;
}