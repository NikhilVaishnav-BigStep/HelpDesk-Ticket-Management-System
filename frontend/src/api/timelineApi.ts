import client from "./client";
import type { TicketTimeline } from "@/types/ticket.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function getTicketTimeline(
    ticketId: string
): Promise<TicketTimeline> {
    const response = await client.get<ApiResponse<TicketTimeline>>(
        `/tickets/${ticketId}/timeline`
    );

    return response.data.data;
}