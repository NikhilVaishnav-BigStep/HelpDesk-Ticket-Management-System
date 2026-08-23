import client from "./client";
import type { Comment, CommentType } from "@/types/ticket.types";

export interface AddCommentPayload {
    message: string;
    type?: CommentType;
}

export async function addComment(
    ticketId: string,
    payload: AddCommentPayload
): Promise<Comment> {
    return client.post(`/tickets/${ticketId}/comments`, payload);
}