import client from "./client";
import type { Attachment } from "@/types/ticket.types";

export async function uploadAttachment(
    ticketId: string,
    file: File
): Promise<Attachment> {
    const formData = new FormData();

    formData.append("file", file);

    return client.post(`/tickets/${ticketId}/attachments`, formData);
}

export async function downloadAttachment(
    attachmentId: string
): Promise<Blob> {
    return client.get(`/attachments/${attachmentId}/download`, {
        responseType: "blob",
    });
}