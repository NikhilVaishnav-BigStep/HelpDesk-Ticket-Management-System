import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid id format");

export const listCategoriesSchema = z.object({
    query: z.object({
        status: z.enum(["active", "inactive"]).optional(),
    }),
});

export const createCategorySchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(1, "Name is required")
            .max(100, "Name cannot exceed 100 characters"),

        status: z.enum(["active", "inactive"]).default("active"),
    }),
});

export const categoryIdParamSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(1, "Name is required")
                .max(100, "Name cannot exceed 100 characters")
                .optional(),

            status: z.enum(["active", "inactive"]).optional(),
        })
        .refine(
            (data) => data.name !== undefined || data.status !== undefined,
            { message: "At least one field must be provided for update" },
        ),
});
