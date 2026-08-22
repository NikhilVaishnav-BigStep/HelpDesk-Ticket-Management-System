import client from "./client";
import type { User } from "../types/user.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

interface AdminCreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: "agent" | "admin";
    teamId?: string;
}

interface LoginData {
    token: string;
    user: User;
}

export const authApi = {
    async login(payload: LoginPayload): Promise<LoginData> {
        const response = await client.post<ApiResponse<LoginData>>(
            "/auth/login",
            payload,
        );

        return response.data.data;
    },

    async register(payload: RegisterPayload): Promise<User> {
        const response = await client.post<ApiResponse<User>>(
            "/auth/register",
            payload,
        );

        return response.data.data;
    },

    async changePassword(
        payload: ChangePasswordPayload,
    ): Promise<void> {
        await client.post<ApiResponse<null>>(
            "/auth/change-password",
            payload,
        );
    },

    async adminCreateUser(
        payload: AdminCreateUserPayload,
    ): Promise<User> {
        const response = await client.post<ApiResponse<User>>(
            "/auth/users",
            payload,
        );

        return response.data.data;
    },
};