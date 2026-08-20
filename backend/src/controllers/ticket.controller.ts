import type { Request, Response, NextFunction } from "express";
import { createNewTicket, getTicketById, getTickets, updateTicket } from "../services/ticket.service.js";
import { sendSuccess } from "../utils/response.js";

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