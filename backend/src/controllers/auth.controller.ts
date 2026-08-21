import type { Request, Response, NextFunction } from "express";
import {
    adminCreateUser,
    changeOwnPassword,
    loginUser,
    registerUser,
} from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await registerUser(req.body);

        const safeUser = user.toObject();
        delete safeUser.password;

        sendSuccess(res, safeUser, "User registered successfully", 201);
    } catch (error) {
        next(error);
    }
};

export const adminCreateUserController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await adminCreateUser(req.body);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user.toObject();

        sendSuccess(res, safeUser, "User created successfully", 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const result = await loginUser(req.body);

        sendSuccess(res, result, "Login successful", 200);
    } catch (error) {
        next(error);
    }
};

export const changePasswordController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        await changeOwnPassword(
            req.user!.userId,
            req.body.currentPassword,
            req.body.newPassword,
        );

        sendSuccess(res, null, "Password changed successfully", 200);
    } catch (error) {
        next(error);
    }
};