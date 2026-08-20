import { Comment, type IComment } from "../models/Comment.js";
import { findTicketById } from "../repositories/ticket.repository.js";
import { TicketStatus } from "../models/Ticket.js";
import { updateTicketById } from "../repositories/ticket.repository.js";
import { AppException } from "../exceptions/AppException.js";
import type { UserRole } from "../models/User.js";
import { findHistoryByTicketId } from "../repositories/ticketHistory.repository.js";
import { Types } from "mongoose";

export const addCommentToTicket = async ({
    ticketId,
    authorId,
    role,
    message,
    type,
}: {
    ticketId: string;
    authorId: string;
    role: UserRole;
    message: string;
    type: IComment["type"];
}): Promise<IComment> => {
    if (role === "customer" && type === "internal") {
        throw new AppException(
            "Customers cannot add internal notes",
            403,
        );
    }

    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (role === "customer" && ticket.customerId.toString() !== authorId) {
        throw new AppException(
            "You are not authorized to comment on this ticket",
            403,
        );
    }

    if (ticket.status === TicketStatus.CLOSED) {
        throw new AppException(
            "Cannot add comments to a closed ticket. Please reopen the ticket first.",
            400,
        );
    }

    const comment = await Comment.create({
        ticketId: new Types.ObjectId(ticketId),
        authorId: new Types.ObjectId(authorId),
        type,
        message,
    });

    if (
        role !== "customer" &&
        !ticket.respondedAt &&
        ticket.status === TicketStatus.OPEN
    ) {
        await updateTicketById(
            ticketId,
            { respondedAt: new Date() } as Parameters<typeof updateTicketById>[1],
        );
    }

    return comment;
};

export const getCommentsForTicket = async ({
    ticketId,
    userId,
    role,
}: {
    ticketId: string;
    userId: string;
    role: UserRole;
}): Promise<IComment[]> => {
    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (role === "customer") {
        if (ticket.customerId.toString() !== userId) {
            throw new AppException(
                "You are not authorized to view this ticket",
                403,
            );
        }

        return Comment.find({ ticketId, type: "external" })
            .sort({ createdAt: 1 })
            .exec();
    }

    return Comment.find({ ticketId }).sort({ createdAt: 1 }).exec();
};

export const getTicketHistory = async ({
    ticketId,
    role,
}: {
    ticketId: string;
    role: UserRole;
}) => {
    if (role === "customer") {
        throw new AppException(
            "You are not authorized to view ticket history",
            403,
        );
    }

    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    return findHistoryByTicketId(
        new Types.ObjectId(ticketId),
    );
};