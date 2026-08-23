import client from "./client";
import type { User } from "@/types/user.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: "customer" | "agent" | "admin";
    search?: string;
    includeDeleted?: string;
}

export interface PaginatedUsers {
    users: User[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export async function getUsers(
    params?: GetUsersParams
): Promise<PaginatedUsers> {
    const response = await client.get<ApiResponse<PaginatedUsers>>("/users", {
        params,
    });

    return response.data.data;
}

export async function getUserById(id: string): Promise<User> {
    const response = await client.get<ApiResponse<User>>(`/users/${id}`);

    return response.data.data;
}

export async function updateUser(
    id: string,
    payload: {
        name?: string;
        role?: "customer" | "agent" | "admin";
        teamId?: string;
    }
): Promise<User> {
    const response = await client.put<ApiResponse<User>>(
        `/users/${id}`,
        payload
    );

    return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
    await client.delete<ApiResponse<null>>(`/users/${id}`);
}

export async function resetUserPassword(
    id: string,
    newPassword: string
): Promise<void> {
    await client.post<ApiResponse<null>>(`/users/${id}/reset-password`, {
        newPassword,
    });
}
