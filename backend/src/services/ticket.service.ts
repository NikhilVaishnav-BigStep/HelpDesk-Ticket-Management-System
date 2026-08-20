import { createTicket, findTicketById, findTickets, updateTicketById } from "../repositories/ticket.repository.js";
import { TicketPriority, TicketStatus } from "../models/Ticket.js";
import { AppException } from "../exceptions/AppException.js";
import { Types } from "mongoose";
import { recordTicketHistory } from "./ticketHistory.service.js";
import { findUserById } from "../repositories/user.repository.js";

interface CreateTicketData {
    customerId: string;
    subject: string;
    description: string;
    priority?: TicketPriority;
    categoryId?: string;
}

export const createNewTicket = async (
    ticketData: CreateTicketData,
) => {
    return createTicket({
        customerId: new Types.ObjectId(ticketData.customerId),
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority ?? TicketPriority.MEDIUM,
        categoryId: ticketData.categoryId
            ? new Types.ObjectId(ticketData.categoryId)
            : undefined,
        status: TicketStatus.OPEN,
    });
};

export const getTicketById = async (
    ticketId: string,
    userId: string,
    role: string,
) => {
    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (role === "customer" && ticket.customerId.toString() !== userId) {
        throw new AppException("You are not authorized to access this ticket", 403);
    }

    return ticket;
};

export const getTickets = async (
    userId: string,
    role: string,
    page: number,
    limit: number,
    filters: {
        status?: string;
        priority?: string;
        assigneeId?: string;
        categoryId?: string;
    },
) => {
    const skip = (page - 1) * limit;

    const ticketFilters = {
        ...filters,
        ...(role === "customer" ? { customerId: userId } : {}),
    };

    const { tickets, total } = await findTickets(
        ticketFilters,
        skip,
        limit,
    );

    return {
        tickets,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

interface UpdateTicketData {
    subject?: string;
    description?: string;
    priority?: TicketPriority;
    categoryId?: string;
}

export const updateTicket = async (
    ticketId: string,
    actorId: string,
    updates: UpdateTicketData,
) => {
    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (ticket.status === TicketStatus.CLOSED) {
        throw new AppException(
            "Closed tickets cannot be updated. Please reopen the ticket first.",
            400,
        );
    }

    const updatePayload: Partial<UpdateTicketData> = {};
    const oldPriority = ticket.priority;

    if (updates.subject !== undefined) {
        updatePayload.subject = updates.subject;
    }

    if (updates.description !== undefined) {
        updatePayload.description = updates.description;
    }

    if (updates.priority !== undefined) {
        updatePayload.priority = updates.priority;
    }

    if (updates.categoryId !== undefined) {
        updatePayload.categoryId = updates.categoryId;
    }

    const updatedTicket = await updateTicketById(
        ticketId,
        updatePayload as Parameters<typeof updateTicketById>[1],
    );

    if (!updatedTicket) {
        throw new AppException("Failed to update ticket", 500);
    }

    if (
        updates.priority !== undefined &&
        updates.priority !== oldPriority
    ) {
        await recordTicketHistory({
            ticketId,
            actorId,
            action: "priority_change",
            oldValue: oldPriority,
            newValue: updates.priority,
        });
    }

    return updatedTicket;
};

const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.OPEN]: [
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
    ],
    [TicketStatus.ASSIGNED]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
    ],
    [TicketStatus.IN_PROGRESS]: [
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
    ],
    [TicketStatus.RESOLVED]: [
        TicketStatus.CLOSED,
        TicketStatus.IN_PROGRESS,
    ],
    [TicketStatus.CLOSED]: [],
};

export const assignTicket = async (
    ticketId: string,
    assigneeId: string,
    actorId: string,
) => {
    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (ticket.status === TicketStatus.CLOSED) {
        throw new AppException(
            "Closed tickets cannot be reassigned. Please reopen the ticket first.",
            400,
        );
    }

    const assignee = await findUserById(assigneeId);

    if (!assignee) {
        throw new AppException("Assignee user not found", 404);
    }

    if (assignee.role === "customer") {
        throw new AppException(
            "Tickets can only be assigned to agents or admins",
            400,
        );
    }

    const previousAssignee = ticket.assigneeId
        ? ticket.assigneeId.toString()
        : null;

    const statusChanged =
        ticket.status === TicketStatus.OPEN &&
        previousAssignee !== assigneeId;

    const updatePayload: Record<string, unknown> = {
        assigneeId: new Types.ObjectId(assigneeId),
    };

    if (statusChanged) {
        updatePayload.status = TicketStatus.ASSIGNED;
    }

    if (!ticket.respondedAt) {
        updatePayload.respondedAt = new Date();
    }

    const updatedTicket = await updateTicketById(
        ticketId,
        updatePayload as Parameters<typeof updateTicketById>[1],
    );

    if (!updatedTicket) {
        throw new AppException("Failed to assign ticket", 500);
    }

    await recordTicketHistory({
        ticketId,
        actorId,
        action: "assign",
        oldValue: previousAssignee,
        newValue: assigneeId,
    });

    if (statusChanged) {
        await recordTicketHistory({
            ticketId,
            actorId,
            action: "status_change",
            oldValue: TicketStatus.OPEN,
            newValue: TicketStatus.ASSIGNED,
        });
    }

    return updatedTicket;
};

export const changeTicketStatus = async (
    ticketId: string,
    newStatus: TicketStatus,
    actorId: string,
) => {
    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (ticket.status === TicketStatus.CLOSED) {
        throw new AppException(
            "Closed tickets cannot change status. Please reopen the ticket first.",
            400,
        );
    }

    if (ticket.status === newStatus) {
        throw new AppException(
            `Ticket is already in '${newStatus}' status`,
            400,
        );
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[ticket.status];

    if (!allowed.includes(newStatus)) {
        throw new AppException(
            `Invalid status transition from '${ticket.status}' to '${newStatus}'`,
            400,
        );
    }

    const now = new Date();
    const updatePayload: Record<string, unknown> = {
        status: newStatus,
    };

    if (!ticket.respondedAt && ticket.status === TicketStatus.OPEN) {
        updatePayload.respondedAt = now;
    }

    if (newStatus === TicketStatus.RESOLVED) {
        updatePayload.resolvedAt = now;
        if (
            ticket.resolutionDueAt &&
            ticket.resolutionDueAt < now &&
            !ticket.breached
        ) {
            updatePayload.breached = true;
        }
    }

    if (newStatus === TicketStatus.CLOSED) {
        updatePayload.closedAt = now;
    }

    const updatedTicket = await updateTicketById(
        ticketId,
        updatePayload as Parameters<typeof updateTicketById>[1],
    );

    if (!updatedTicket) {
        throw new AppException("Failed to change ticket status", 500);
    }

    await recordTicketHistory({
        ticketId,
        actorId,
        action:
            newStatus === TicketStatus.CLOSED ? "close" : "status_change",
        oldValue: ticket.status,
        newValue: newStatus,
    });

    return updatedTicket;
};