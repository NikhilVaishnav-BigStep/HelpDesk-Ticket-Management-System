import client from "./client";
import type {
    Ticket,
    Priority,
} from "@/types/ticket.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface CreateTicketPayload {
    subject: string;
    description: string;
    priority?: Priority;
    categoryId?: string;
}

export interface GetTicketsParams {
    page?: number;
    limit?: number;
}

export interface PaginatedTickets {
    tickets: Ticket[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export async function createTicket(
    payload: CreateTicketPayload
): Promise<Ticket> {
    const response = await client.post<ApiResponse<Ticket>>("/tickets", payload);

    return response.data.data;
}

export async function getTickets(
    params?: GetTicketsParams
): Promise<PaginatedTickets> {
    const response = await client.get<ApiResponse<PaginatedTickets>>("/tickets", {
        params,
    });

    return response.data.data;
}

export async function getTicketById(id: string): Promise<Ticket> {
    const response = await client.get<ApiResponse<Ticket>>(`/tickets/${id}`);

    return response.data.data;
}