import type { Request, Response, NextFunction } from "express";
import { getAllSLAPolicies, updateSLAPolicy } from "../services/sla.service.js";
import { TicketPriority } from "../models/Ticket.js";
import { sendSuccess } from "../utils/response.js";

export const listSlaPoliciesController = async (
    _req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const policies = await getAllSLAPolicies();
        return sendSuccess(
            res,
            policies,
            "SLA policies retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const updateSlaPolicyController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const priority = String(req.params.priority) as TicketPriority;
        const sla = await updateSLAPolicy(priority, {
            responseTarget: req.body.responseTarget,
            resolutionTarget: req.body.resolutionTarget,
        });

        return sendSuccess(
            res,
            sla,
            "SLA policy updated successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};
