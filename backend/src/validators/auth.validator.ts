import { z } from "zod";

const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().toLowerCase().email(),
        password: passwordSchema,
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(8).max(128),
    }),
});

export const adminCreateUserSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().toLowerCase().email(),
        password: passwordSchema,
        role: z.enum(["agent", "admin"]),
        teamId: z.string().optional(),
    }),
});

export const changePasswordSchema = z
    .object({
        body: z.object({
            currentPassword: passwordSchema,
            newPassword: passwordSchema,
        }),
    })
    .refine((data) => data.body.newPassword !== data.body.currentPassword, {
        message: "newPassword must be different from currentPassword",
        path: ["body", "newPassword"],
    });

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid id format");

export const userResetPasswordSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        newPassword: passwordSchema,
    }),
});