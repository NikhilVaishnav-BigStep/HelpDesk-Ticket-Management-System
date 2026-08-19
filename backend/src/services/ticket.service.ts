import { createTicket, findTicketById, findTickets } from "../repositories/ticket.repository.js";
import { TicketPriority, TicketStatus } from "../models/Ticket.js";
import { AppException } from "../exceptions/AppException.js";
import { Types } from "mongoose";

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