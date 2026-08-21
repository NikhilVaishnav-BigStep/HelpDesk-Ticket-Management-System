import type { Request, Response, NextFunction } from "express";
import {
    getUserByIdOrThrow,
    listUsers,
    softDeleteUser,
    updateUser,
} from "../services/user.service.js";
import { resetUserPassword } from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

export const listUsersController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { page, limit, role, search, includeDeleted } = req.query;
        const result = await listUsers({
            page: Number(page),
            limit: Number(limit),
            role: role as
                | "customer"
                | "agent"
                | "admin"
                | undefined,
            search: search as string | undefined,
            includeDeleted: includeDeleted as boolean | undefined,
        });
        return sendSuccess(
            res,
            result,
            "Users retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const getUserController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const user = await getUserByIdOrThrow(String(req.params.id));
        return sendSuccess(res, user, "User retrieved successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const updateUserController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const user = await updateUser(String(req.params.id), req.body);
        return sendSuccess(res, user, "User updated successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const deleteUserController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await softDeleteUser(String(req.params.id));
        return sendSuccess(res, null, "User deleted successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const resetUserPasswordController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await resetUserPassword(
            String(req.params.id),
            req.body.newPassword,
        );
        return sendSuccess(
            res,
            null,
            "User password reset successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};
