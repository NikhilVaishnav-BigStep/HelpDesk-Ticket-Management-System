import client from "./client";
import type { Category } from "@/types/category.types";

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