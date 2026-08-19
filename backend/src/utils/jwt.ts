import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../models/User.js";
import { env } from "../config/env.js";

export interface JwtPayload {
    userId: string;
    role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
};