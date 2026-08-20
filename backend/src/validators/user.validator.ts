import { z } from "zod";
import { USER_ROLES } from "../models/User.js";

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid id format");

export const userIdParamSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const listUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        role: z.enum(USER_ROLES).optional(),
        search: z.string().trim().min(1).max(100).optional(),
        includeDeleted: z
            .union([z.literal("true"), z.literal("false")])
            .optional()
            .transform((v) => v === "true"),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z
        .object({
            name: z.string().trim().min(2).max(100).optional(),
            role: z.enum(USER_ROLES).optional(),
            teamId: z.string().trim().min(1).max(100).optional(),
        })
        .refine(
            (data) =>
                data.name !== undefined ||
                data.role !== undefined ||
                data.teamId !== undefined,
            { message: "At least one field must be provided for update" },
        ),
});
