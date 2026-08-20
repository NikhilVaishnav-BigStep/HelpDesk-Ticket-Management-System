import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppException } from "../exceptions/AppException.js";
import { logger } from "../logger/logger.js";
import { ZodError } from "zod";

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    next: NextFunction,
): void => {
    void next;

    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues,
        });

        return;
    }

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({
                success: false,
                message: "File too large. Maximum size is 10 MB",
            });
            return;
        }

        res.status(400).json({
            success: false,
            message: `Upload error: ${error.message}`,
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