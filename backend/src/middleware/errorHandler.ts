import { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/AppException.js";
import { logger } from "../logger/logger.js";

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (error instanceof AppException) {
        logger.error(error.message);

        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });

        return;
    }

    logger.error("Unexpected error", error);

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};