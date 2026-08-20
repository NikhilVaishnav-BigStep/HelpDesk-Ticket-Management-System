import type { Request, Response, NextFunction } from "express";
import {
    assignTicket,
    bulkAssignTickets,
    bulkChangeTicketsStatus,
    changeTicketStatus,
    createNewTicket,
    getTicketById,
    getTickets,
    reopenTicket,
    updateTicket,
} from "../services/ticket.service.js";
import { TicketStatus } from "../models/Ticket.js";
import {
    addCommentToTicket,
    getCommentsForTicket,
    getTicketHistory,
} from "../services/comment.service.js";
import { getTicketTimeline } from "../services/timeline.service.js";
import { sendSuccess } from "../utils/response.js";
import type { UserRole } from "../models/User.js";

export const createTicket = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const ticket = await createNewTicket({
            customerId: req.user!.userId,
            subject: req.body.subject,
            description: req.body.description,
            priority: req.body.priority,
            categoryId: req.body.categoryId,
        });

        return sendSuccess(res, ticket, "Ticket created successfully", 201);
    } catch (error) {
        next(error);
    }
};

export const getTicket = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const ticket = await getTicketById(
            String(req.params.id),
            req.user!.userId,
            req.user!.role,
        );

        return sendSuccess(res, ticket, "Ticket retrieved successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const getTicketList = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const {
            page,
            limit,
            status,
            priority,
            assigneeId,
            categoryId,
            startDate,
            endDate,
            search,
            sortBy,
            order,
        } = req.query;

        const result = await getTickets(
            req.user!.userId,
            req.user!.role,
            Number(page),
            Number(limit),
            {
                status: status as string | undefined,
                priority: priority as string | undefined,
                assigneeId: assigneeId as string | undefined,
                categoryId: categoryId as string | undefined,
                startDate: startDate as string | undefined,
                endDate: endDate as string | undefined,
                search: search as string | undefined,
                sortBy: sortBy as
                    | "createdAt"
                    | "updatedAt"
                    | "priority"
                    | "status"
                    | undefined,
                order: order as "asc" | "desc" | undefined,
            },
        );

        return sendSuccess(res, result, "Tickets retrieved successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const updateTicketController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const updatedTicket = await updateTicket(
            String(req.params.id),
            req.user!.userId,
            req.body,
        );

        return sendSuccess(
            res,
            updatedTicket,
            "Ticket updated successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const assignTicketController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const ticket = await assignTicket(
            String(req.params.id),
            req.body.assigneeId,
            req.user!.userId,
        );

        return sendSuccess(res, ticket, "Ticket assigned successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const changeStatusController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const ticket = await changeTicketStatus(
            String(req.params.id),
            req.body.status,
            req.user!.userId,
        );

        return sendSuccess(
            res,
            ticket,
            "Ticket status changed successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const addCommentController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const comment = await addCommentToTicket({
            ticketId: String(req.params.id),
            authorId: req.user!.userId,
            role: req.user!.role as UserRole,
            message: req.body.message,
            type: req.body.type,
        });

        return sendSuccess(
            res,
            comment,
            "Comment added successfully",
            201,
        );
    } catch (error) {
        next(error);
    }
};

export const listCommentsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const comments = await getCommentsForTicket({
            ticketId: String(req.params.id),
            userId: req.user!.userId,
            role: req.user!.role as UserRole,
        });

        return sendSuccess(
            res,
            comments,
            "Comments retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const listHistoryController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const history = await getTicketHistory({
            ticketId: String(req.params.id),
            role: req.user!.role as UserRole,
        });

        return sendSuccess(
            res,
            history,
            "Ticket history retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const reopenTicketController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const ticket = await reopenTicket(
            String(req.params.id),
            req.user!.userId,
        );

        return sendSuccess(res, ticket, "Ticket reopened successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const bulkAssignTicketsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await bulkAssignTickets(
            req.body.ticketIds,
            req.body.assigneeId,
            req.user!.userId,
        );

        return sendSuccess(
            res,
            result,
            `Bulk assignment completed: ${result.succeeded}/${result.requested} succeeded`,
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const bulkChangeStatusController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await bulkChangeTicketsStatus(
            req.body.ticketIds,
            req.body.status as TicketStatus,
            req.user!.userId,
        );

        return sendSuccess(
            res,
            result,
            `Bulk status change completed: ${result.succeeded}/${result.requested} succeeded`,
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const getTicketTimelineController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const timeline = await getTicketTimeline(
            String(req.params.id),
            req.user!.userId,
            req.user!.role as UserRole,
        );

        return sendSuccess(
            res,
            timeline,
            "Ticket timeline retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};