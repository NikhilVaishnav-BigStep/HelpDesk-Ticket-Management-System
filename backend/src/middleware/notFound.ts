import { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/AppException.js";

export const notFound = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    next(new AppException(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};