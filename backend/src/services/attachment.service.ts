import crypto from "crypto";
import path from "path";
import { Readable } from "stream";
import { Types } from "mongoose";
import {
    createAttachment,
    findAttachmentById,
} from "../repositories/attachment.repository.js";
import { findTicketById } from "../repositories/ticket.repository.js";
import { storageService } from "./storage/index.js";
import { AppException } from "../exceptions/AppException.js";
import { TicketStatus } from "../models/Ticket.js";
import type { UserRole } from "../models/User.js";

const sanitizeFileName = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const generateStorageKey = (
    ticketId: string,
    originalName: string,
): string => {
    const random = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    return `${ticketId}/${timestamp}-${random}-${sanitizeFileName(base)}${ext}`;
};

export const uploadAttachment = async ({
    ticketId,
    uploaderId,
    role,
    file,
}: {
    ticketId: string;
    uploaderId: string;
    role: UserRole;
    file: Express.Multer.File;
}) => {
    if (!file) {
        throw new AppException("No file provided", 400);
    }

    const ticket = await findTicketById(ticketId);

    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    if (role === "customer" && ticket.customerId.toString() !== uploaderId) {
        throw new AppException(
            "You are not authorized to upload to this ticket",
            403,
        );
    }

    if (ticket.status === TicketStatus.CLOSED) {
        throw new AppException(
            "Cannot upload to a closed ticket. Please reopen the ticket first.",
            400,
        );
    }

    const storageKey = generateStorageKey(ticketId, file.originalname);

    await storageService.save(
        storageKey,
        file.buffer,
        file.mimetype,
    );

    const attachment = await createAttachment({
        ticketId: new Types.ObjectId(ticketId),
        uploadedBy: new Types.ObjectId(uploaderId),
        fileName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
    });

    return attachment;
};

export const getAttachmentMetadata = async ({
    attachmentId,
    userId,
    role,
}: {
    attachmentId: string;
    userId: string;
    role: UserRole;
}) => {
    const attachment = await findAttachmentById(attachmentId);

    if (!attachment) {
        throw new AppException("Attachment not found", 404);
    }

    if (role === "customer") {
        const ticket = await findTicketById(attachment.ticketId.toString());

        if (!ticket || ticket.customerId.toString() !== userId) {
            throw new AppException(
                "You are not authorized to view this attachment",
                403,
            );
        }
    }

    return attachment;
};

export const downloadAttachment = async ({
    attachmentId,
    userId,
    role,
}: {
    attachmentId: string;
    userId: string;
    role: UserRole;
}): Promise<{
    stream: Readable;
    fileName: string;
    mimeType: string;
    size: number;
}> => {
    const attachment = await getAttachmentMetadata({
        attachmentId,
        userId,
        role,
    });

    const exists = await storageService.exists(attachment.storageKey);

    if (!exists) {
        throw new AppException("Attachment file not found on storage", 404);
    }

    const stream = await storageService.get(attachment.storageKey);

    return {
        stream,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
    };
};