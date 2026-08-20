import { z } from "zod";
import { TicketPriority, TicketStatus } from "../models/Ticket.js";

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

export const updateTicketSchema = z.object({
    body: z
        .object({
            subject: z
                .string()
                .trim()
                .min(1, "Subject is required")
                .max(200, "Subject cannot exceed 200 characters")
                .optional(),

            description: z
                .string()
                .trim()
                .min(1, "Description is required")
                .optional(),

            priority: z
                .enum(TicketPriority)
                .optional(),

            categoryId: z
                .string()
                .optional(),
        })
        .refine(
            (data) =>
                data.subject !== undefined ||
                data.description !== undefined ||
                data.priority !== undefined ||
                data.categoryId !== undefined,
            { message: "At least one field must be provided for update" },
        ),
});

export const assignTicketSchema = z.object({
    body: z.object({
        assigneeId: z.string().min(1, "Assignee ID is required"),
    }),
});

export const changeStatusSchema = z.object({
    body: z.object({
        status: z.enum(
            TicketStatus as unknown as [string, ...string[]],
        ),
    }),
});