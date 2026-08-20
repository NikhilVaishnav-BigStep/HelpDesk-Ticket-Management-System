import request from "supertest";
import type { Application } from "express";
import { User } from "../../src/models/User.js";
import { hashPassword } from "../../src/utils/password.js";
import { generateToken } from "../../src/utils/jwt.js";

export interface SeededUser {
    id: string;
    email: string;
    name: string;
    role: "customer" | "agent" | "admin";
    token: string;
    password: string;
}

const PASSWORD = "Password@1234";

export const seedUser = async (params: {
    email: string;
    name: string;
    role: "customer" | "agent" | "admin";
}): Promise<SeededUser> => {
    const hashed = await hashPassword(PASSWORD);
    const user = await User.create({
        email: params.email.toLowerCase(),
        name: params.name,
        password: hashed,
        role: params.role,
    });

    const token = generateToken({
        userId: user._id.toString(),
        role: user.role,
    });

    return {
        id: user._id.toString(),
        email: params.email,
        name: params.name,
        role: params.role,
        token,
        password: PASSWORD,
    };
};

export const authHeader = (token: string) =>
    ({ Authorization: `Bearer ${token}` }) as const;

export const login = async (
    app: Application,
    email: string,
    password: string = PASSWORD,
) => {
    return request(app)
        .post("/api/v1/auth/login")
        .send({ email: email.toLowerCase(), password });
};
