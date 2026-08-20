import type { ITicket, TicketStatus } from "../../models/Ticket.js";

export interface NotificationRecipient {
    userId: string;
    role: "customer" | "agent" | "admin";
    email: string;
    name: string;
}

export interface NotificationEvent<T = unknown> {
    type:
        | "ticket_created"
        | "ticket_assigned"
        | "ticket_status_changed"
        | "ticket_reopened";
    ticket: ITicket;
    recipients: NotificationRecipient[];
    payload: T;
    createdAt: Date;
}

export interface TicketAssignedPayload {
    previousAssigneeId: string | null;
    newAssigneeId: string;
}

export interface TicketStatusChangedPayload {
    oldStatus: TicketStatus;
    newStatus: TicketStatus;
}

export interface NotificationService {
    notifyTicketCreated(ticket: ITicket): Promise<void>;
    notifyTicketAssigned(
        ticket: ITicket,
        previousAssigneeId: string | null,
        newAssigneeId: string,
    ): Promise<void>;
    notifyTicketStatusChanged(
        ticket: ITicket,
        oldStatus: TicketStatus,
        newStatus: TicketStatus,
    ): Promise<void>;
    notifyTicketReopened(ticket: ITicket): Promise<void>;
}
