import type { Request, Response, NextFunction } from "express";
import { generateTicketReport } from "../services/report.service.js";
import { sendSuccess } from "../utils/response.js";

export const getTicketReportsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { startDate, endDate, categoryId } = req.query;

        const report = await generateTicketReport({
            startDate: startDate as string | undefined,
            endDate: endDate as string | undefined,
            categoryId: categoryId as string | undefined,
        });

        return sendSuccess(
            res,
            report,
            "Ticket report metrics retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};
