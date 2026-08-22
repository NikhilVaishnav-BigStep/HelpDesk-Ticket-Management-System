import client from "./client";
import type {
    Ticket,
    Priority,
    TicketStatus,
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
    status?: TicketStatus;
    priority?: Priority;
    categoryId?: string;
    assigneeId?: string;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
    order?: "asc" | "desc";
    startDate?: string;
    endDate?: string;
}

export interface PaginatedTickets {
    tickets: Ticket[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface BulkResult {
    requested: number;
    succeeded: number;
    failed: number;
    results: Array<{
        ticketId: string;
        success: boolean;
        message?: string;
    }>;
}

// ── Core CRUD ──────────────────────────────────────────────

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

// ── Assignment ─────────────────────────────────────────────

export async function assignTicket(
    ticketId: string,
    assigneeId: string
): Promise<Ticket> {
    const response = await client.put<ApiResponse<Ticket>>(
        `/tickets/${ticketId}/assign`,
        { assigneeId }
    );

    return response.data.data;
}

// ── Status transitions ────────────────────────────────────

export async function changeTicketStatus(
    ticketId: string,
    status: TicketStatus
): Promise<Ticket> {
    const response = await client.put<ApiResponse<Ticket>>(
        `/tickets/${ticketId}/status`,
        { status }
    );

    return response.data.data;
}

export async function reopenTicket(ticketId: string): Promise<Ticket> {
    const response = await client.post<ApiResponse<Ticket>>(
        `/tickets/${ticketId}/reopen`
    );

    return response.data.data;
}

// ── Bulk actions ──────────────────────────────────────────

export async function bulkAssignTickets(
    ticketIds: string[],
    assigneeId: string
): Promise<BulkResult> {
    const response = await client.post<ApiResponse<BulkResult>>(
        "/tickets/bulk/assign",
        { ticketIds, assigneeId }
    );

    return response.data.data;
}

export async function bulkChangeStatus(
    ticketIds: string[],
    status: TicketStatus
): Promise<BulkResult> {
    const response = await client.post<ApiResponse<BulkResult>>(
        "/tickets/bulk/status",
        { ticketIds, status }
    );

    return response.data.data;
}