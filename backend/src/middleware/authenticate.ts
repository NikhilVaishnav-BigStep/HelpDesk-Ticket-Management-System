import type { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/AppException.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        next(new AppException("Authentication required", 401));
        return;
    }

    const token = authorization.split(" ")[1];

    if (!token) {
        next(new AppException("Authentication required", 401));
        return;
    }

    try {
        const payload = verifyToken(token);

        req.user = {
            userId: payload.userId,
            role: payload.role,
        };

        next();
    } catch {
        next(new AppException("Invalid or expired token", 401));
    }
};