import client from "./client";
import type { Category, CategoryStatus } from "@/types/category.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function getCategories(status?: "active" | "inactive") {
    const response = await client.get<ApiResponse<Category[]>>("/categories", {
        params: status ? { status } : undefined,
    });

    return response.data.data;
}

export async function getCategoryById(id: string): Promise<Category> {
    const response = await client.get<ApiResponse<Category>>(
        `/categories/${id}`
    );

    return response.data.data;
}

export async function createCategory(payload: {
    name: string;
    status?: CategoryStatus;
}): Promise<Category> {
    const response = await client.post<ApiResponse<Category>>(
        "/categories",
        payload
    );

    return response.data.data;
}

export async function updateCategory(
    id: string,
    payload: {
        name?: string;
        status?: CategoryStatus;
    }
): Promise<Category> {
    const response = await client.put<ApiResponse<Category>>(
        `/categories/${id}`,
        payload
    );

    return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
    await client.delete<ApiResponse<null>>(`/categories/${id}`);
}