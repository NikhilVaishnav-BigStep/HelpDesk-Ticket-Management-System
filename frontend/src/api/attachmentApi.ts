import client from "./client";
import type { Attachment } from "@/types/ticket.types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function uploadAttachment(
    ticketId: string,
    file: File
): Promise<Attachment> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await client.post<ApiResponse<Attachment>>(
        `/tickets/${ticketId}/attachments`,
        formData
    );

    return response.data.data;
}

export async function downloadAttachment(
    attachmentId: string
): Promise<Blob> {
    const response = await client.get<Blob>(
        `/attachments/${attachmentId}/download`,
        {
            responseType: "blob",
        }
    );

    return response.data;
}