import { Ticket, type ITicket } from "../models/Ticket.js";
import { Types } from "mongoose";

export const createTicket = async (
    ticketData: Partial<ITicket>,
): Promise<ITicket> => {
    return Ticket.create(ticketData);
};

export const findTicketById = async (
    ticketId: string,
): Promise<ITicket | null> => {
    return Ticket.findById(ticketId)
        .populate("customerId", "_id name email role")
        .populate("assigneeId", "_id name email role")
        .populate("categoryId", "_id name status");
};

export const findTicketsByCustomerId = async (
    customerId: Types.ObjectId,
): Promise<ITicket[]> => {
    return Ticket.find({ customerId })
        .populate("customerId", "_id name email role")
        .populate("assigneeId", "_id name email role")
        .populate("categoryId", "_id name status")
        .sort({ createdAt: -1 });
};

export const updateTicketById = async (
    ticketId: string,
    updateData: Partial<ITicket>,
): Promise<ITicket | null> => {
    return Ticket.findByIdAndUpdate(ticketId, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("customerId", "_id name email role")
        .populate("assigneeId", "_id name email role")
        .populate("categoryId", "_id name status");
};

export interface TicketFilter {
    status?: string;
    priority?: string;
    assigneeId?: string;
    categoryId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
    order?: "asc" | "desc";
    agentScoped?: boolean;
    agentUserId?: string;
}

const escapeRegex = (input: string): string =>
    input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
        if (filters.assigneeId === "unassigned" || filters.assigneeId === "null") {
            query.assigneeId = null;
            // Unassigned tickets listed for agents should not include closed tickets
            if (!filters.status) {
                query.status = { $ne: "closed" };
            }
        } else if (Types.ObjectId.isValid(filters.assigneeId)) {
            query.assigneeId = new Types.ObjectId(filters.assigneeId);
        } else {
            query.assigneeId = filters.assigneeId;
        }
    }

    if (filters.agentScoped && filters.agentUserId && Types.ObjectId.isValid(filters.agentUserId)) {
        const agentOid = new Types.ObjectId(filters.agentUserId);
        query.$or = [
            { assigneeId: agentOid },
            { assigneeId: null, status: { $ne: "closed" } },
        ];
    }

    if (filters.categoryId && Types.ObjectId.isValid(filters.categoryId)) {
        query.categoryId = new Types.ObjectId(filters.categoryId);
    }

    if (filters.customerId && Types.ObjectId.isValid(filters.customerId)) {
        query.customerId = new Types.ObjectId(filters.customerId);
    }

    if (filters.startDate || filters.endDate) {
        const range: Record<string, Date> = {};
        if (filters.startDate) {
            range.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            range.$lte = new Date(filters.endDate);
        }
        query.createdAt = range;
    }

    if (filters.search) {
        const safe = escapeRegex(filters.search.trim());
        const re = new RegExp(safe, "i");
        const searchOr = [{ subject: re }, { description: re }];

        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                { $or: searchOr },
            ];
            delete query.$or;
        } else {
            query.$or = searchOr;
        }
    }

    const sortField = filters.sortBy ?? "createdAt";
    const sortOrder = filters.order === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [tickets, total] = await Promise.all([
        Ticket.find(query)
            .populate("customerId", "_id name email role")
            .populate("assigneeId", "_id name email role")
            .populate("categoryId", "_id name status")
            .sort(sort)
            .skip(skip)
            .limit(limit),

        Ticket.countDocuments(query),
    ]);

    return {
        tickets,
        total,
    };
};