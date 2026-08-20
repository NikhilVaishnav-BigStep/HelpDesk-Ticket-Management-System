import { Types } from "mongoose";
import { TicketHistory, type ITicketHistory } from "../models/TicketHistory.js";

export const createTicketHistory = async (
    data: {
        ticketId: string | Types.ObjectId;
        actorId: string | Types.ObjectId;
        action: ITicketHistory["action"];
        oldValue?: string | null;
        newValue?: string | null;
    },
): Promise<ITicketHistory> => {
    return TicketHistory.create({
        ticketId: data.ticketId,
        actorId: data.actorId,
        action: data.action,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue ?? null,
    });
};

export const findHistoryByTicketId = async (
    ticketId: string | Types.ObjectId,
): Promise<ITicketHistory[]> => {
    return TicketHistory.find({ ticketId }).sort({ createdAt: 1 }).exec();
};