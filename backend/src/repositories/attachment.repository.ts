import { Types } from "mongoose";
import { Attachment, type IAttachment } from "../models/Attachment.js";

export const createAttachment = async (
    data: {
        ticketId: string | Types.ObjectId;
        uploadedBy: string | Types.ObjectId;
        fileName: string;
        storageKey: string;
        mimeType: string;
        size: number;
    },
): Promise<IAttachment> => {
    return Attachment.create({
        ticketId: data.ticketId,
        uploadedBy: data.uploadedBy,
        fileName: data.fileName,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        size: data.size,
    });
};

export const findAttachmentById = async (
    id: string,
): Promise<IAttachment | null> => {
    return Attachment.findById(id).exec();
};

export const findAttachmentsByTicketId = async (
    ticketId: string | Types.ObjectId,
): Promise<IAttachment[]> => {
    return Attachment.find({ ticketId }).sort({ createdAt: -1 }).exec();
};