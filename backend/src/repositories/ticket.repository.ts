import { Ticket, type ITicket } from "../models/Ticket.js";
import type { Types } from "mongoose";

export const createTicket = async (
    ticketData: Partial<ITicket>,
): Promise<ITicket> => {
    return Ticket.create(ticketData);
};

export const findTicketById = async (
    ticketId: string,
): Promise<ITicket | null> => {
    return Ticket.findById(ticketId);
};

export const findTicketsByCustomerId = async (
    customerId: Types.ObjectId,
): Promise<ITicket[]> => {
    return Ticket.find({ customerId }).sort({ createdAt: -1 });
};

export const updateTicketById = async (
    ticketId: string,
    updateData: Partial<ITicket>,
): Promise<ITicket | null> => {
    return Ticket.findByIdAndUpdate(ticketId, updateData, {
        new: true,
        runValidators: true,
    });
};

export interface TicketFilter {
    status?: string;
    priority?: string;
    assigneeId?: string;
    categoryId?: string;
    customerId?: string;
}

export const findTickets = async (
    filters: TicketFilter,
    skip: number,
    limit: number,
) => {
    const query: Record<string, unknown> = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.priority) {
        query.priority = filters.priority;
    }

    if (filters.assigneeId) {
        query.assigneeId = filters.assigneeId;
    }

    if (filters.categoryId) {
        query.categoryId = filters.categoryId;
    }

    if (filters.customerId) {
        query.customerId = filters.customerId;
    }

    const [tickets, total] = await Promise.all([
        Ticket.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Ticket.countDocuments(query),
    ]);

    return {
        tickets,
        total,
    };
};