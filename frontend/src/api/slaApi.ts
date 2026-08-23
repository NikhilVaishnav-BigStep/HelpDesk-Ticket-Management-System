import client from "./client";
import type { SlaPolicy } from "@/types/sla.types";
import type { Priority } from "@/types/ticket.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function getSlaPolicies(): Promise<SlaPolicy[]> {
    const response = await client.get<ApiResponse<SlaPolicy[]>>("/sla");

    return response.data.data;
}

export async function updateSlaPolicy(
    priority: Priority,
    payload: {
        responseTarget: number;
        resolutionTarget: number;
    }
): Promise<SlaPolicy> {
    const response = await client.put<ApiResponse<SlaPolicy>>(
        `/sla/${priority}`,
        payload
    );

    return response.data.data;
}
