import client from "./client";
import type { TicketReport } from "@/types/report.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface GetReportParams {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
}

export async function getTicketReport(
    params?: GetReportParams
): Promise<TicketReport> {
    const response = await client.get<ApiResponse<TicketReport>>(
        "/reports/tickets",
        {
            params,
        }
    );

    return response.data.data;
}
