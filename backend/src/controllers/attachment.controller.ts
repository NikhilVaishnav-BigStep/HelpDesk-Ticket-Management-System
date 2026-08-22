import type { Request, Response, NextFunction } from "express";
import {
    downloadAttachment,
    getAttachmentMetadata,
    uploadAttachment,
} from "../services/attachment.service.js";
import { sendSuccess } from "../utils/response.js";
import type { UserRole } from "../models/User.js";
import { notifyTicketEvent } from "../socket/socketServer.js";

export const uploadAttachmentController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const attachment = await uploadAttachment({
            ticketId: String(req.params.id),
            uploaderId: req.user!.userId,
            role: req.user!.role as UserRole,
            file: req.file!,
        });

        notifyTicketEvent(String(req.params.id), "new_attachment", attachment);

        return sendSuccess(
            res,
            attachment,
            "Attachment uploaded successfully",
            201,
        );
    } catch (error) {
        next(error);
    }
};

export const getAttachmentMetadataController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const attachment = await getAttachmentMetadata({
            attachmentId: String(req.params.id),
            userId: req.user!.userId,
            role: req.user!.role as UserRole,
        });

        return sendSuccess(
            res,
            attachment,
            "Attachment metadata retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const downloadAttachmentController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await downloadAttachment({
            attachmentId: String(req.params.id),
            userId: req.user!.userId,
            role: req.user!.role as UserRole,
        });

        res.setHeader("Content-Type", result.mimeType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${result.fileName}"`,
        );
        res.setHeader("Content-Length", String(result.size));

        result.stream.pipe(res);
    } catch (error) {
        next(error);
    }
};