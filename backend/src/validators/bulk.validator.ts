import { z } from "zod";
import { TicketStatus } from "../models/Ticket.js";

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid ticket id format");

const ticketIdsSchema = z
    .array(objectIdSchema)
    .min(1, "ticketIds must contain at least one id")
    .max(100, "ticketIds cannot exceed 100 entries");

export const bulkAssignSchema = z.object({
    body: z.object({
        ticketIds: ticketIdsSchema,
        assigneeId: z
            .string()
            .regex(/^[a-f\d]{24}$/i, "Invalid assignee id format"),
    }),
});

export const bulkChangeStatusSchema = z.object({
    body: z.object({
        ticketIds: ticketIdsSchema,
        status: z.enum(
            TicketStatus as unknown as [string, ...string[]],
        ),
    }),
});
