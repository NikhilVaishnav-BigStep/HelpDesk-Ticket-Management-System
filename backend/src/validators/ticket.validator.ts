import { z } from "zod";
import { TicketPriority } from "../models/Ticket.js";

export const createTicketSchema = z.object({
    body: z.object({
        subject: z
            .string()
            .trim()
            .min(1, "Subject is required")
            .max(200, "Subject cannot exceed 200 characters"),

        description: z
            .string()
            .trim()
            .min(1, "Description is required"),

        priority: z
            .enum(TicketPriority)
            .default(TicketPriority.MEDIUM),

        categoryId: z
            .string()
            .optional(),
    }),
});

export const listTicketsSchema = z.object({
    query: z.object({
        page: z.coerce
            .number()
            .int()
            .min(1)
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(10),

        status: z
            .string()
            .optional(),

        priority: z
            .string()
            .optional(),

        assigneeId: z
            .string()
            .optional(),

        categoryId: z
            .string()
            .optional(),
    }),
});