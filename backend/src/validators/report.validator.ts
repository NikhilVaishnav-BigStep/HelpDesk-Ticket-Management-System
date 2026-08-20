import { z } from "zod";

const isoOrDateString = z
    .string()
    .refine(
        (val) => !Number.isNaN(Date.parse(val)),
        "Invalid date format",
    );

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid category id format");

export const ticketReportSchema = z.object({
    query: z
        .object({
            startDate: isoOrDateString.optional(),
            endDate: isoOrDateString.optional(),
            categoryId: objectIdSchema.optional(),
        })
        .refine(
            (data) =>
                data.startDate === undefined ||
                data.endDate === undefined ||
                Date.parse(data.startDate) <= Date.parse(data.endDate),
            {
                message: "startDate must be on or before endDate",
                path: ["startDate"],
            },
        ),
});
