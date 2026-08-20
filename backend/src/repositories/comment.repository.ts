import { Types } from "mongoose";
import { Comment, type IComment } from "../models/Comment.js";

export const createComment = async (
    data: {
        ticketId: string | Types.ObjectId;
        authorId: string | Types.ObjectId;
        type: IComment["type"];
        message: string;
    },
): Promise<IComment> => {
    return Comment.create({
        ticketId: data.ticketId,
        authorId: data.authorId,
        type: data.type,
        message: data.message,
    });
};

export const findCommentsByTicketId = async (
    ticketId: string | Types.ObjectId,
    type?: IComment["type"],
): Promise<IComment[]> => {
    const query: Record<string, unknown> = { ticketId };

    if (type) {
        query.type = type;
    }

    return Comment.find(query).sort({ createdAt: 1 }).exec();
};