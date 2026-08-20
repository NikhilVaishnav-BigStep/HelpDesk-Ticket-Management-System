import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(8).max(128),
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
        password: z.string().min(8).max(128),
        role: z.enum(["agent", "admin"]),
        teamId: z.string().optional(),
    }),
});