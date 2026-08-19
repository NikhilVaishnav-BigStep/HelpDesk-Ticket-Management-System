import { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/AppException.js";
import { logger } from "../logger/logger.js";
import { ZodError } from "zod";

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues,
        });

        return;
    }
    
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