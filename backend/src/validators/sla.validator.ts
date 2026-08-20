import { z } from "zod";
import { TicketPriority } from "../models/Ticket.js";

export const listSlaSchema = z.object({});

export const updateSlaSchema = z.object({
    params: z.object({
        priority: z.enum(
            TicketPriority as unknown as [string, ...string[]],
        ),
    }),
    body: z
        .object({
            responseTarget: z
                .number()
                .int()
                .positive("responseTarget must be a positive integer"),

            resolutionTarget: z
                .number()
                .int()
                .positive("resolutionTarget must be a positive integer"),
        })
        .refine(
            (data) => data.responseTarget <= data.resolutionTarget,
            {
                message:
                    "resolutionTarget must be greater than or equal to responseTarget",
                path: ["resolutionTarget"],
            },
        ),
});
