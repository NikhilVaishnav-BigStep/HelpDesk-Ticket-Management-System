import type { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/AppException.js";
import { verifyToken } from "../utils/jwt.js";
import { findUserById } from "../repositories/user.repository.js";

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
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

        const user = await findUserById(payload.userId);
        if (!user || user.deleted) {
            next(new AppException("User account is inactive or deleted", 401));
            return;
        }

        req.user = {
            userId: payload.userId,
            role: user.role,
        };

        next();
    } catch (err) {
        if (err instanceof AppException) {
            next(err);
            return;
        }
        next(new AppException("Invalid or expired token", 401));
    }
};