import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../models/User.js";
import { AppException } from "../exceptions/AppException.js";

export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new AppException("Authentication required", 401));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(new AppException("You do not have permission to perform this action", 403));
            return;
        }

        next();
    };
};