import type { Request, Response, NextFunction } from "express";
import { registerUser } from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await registerUser(req.body);

        const { password, ...safeUser } = user.toObject();

        sendSuccess(res, safeUser, "User registered successfully", 201);
    } catch (error) {
        next(error);
    }
};