import { Schema, model, type Document } from "mongoose";

export interface ISLA extends Document {
    priority: "low" | "medium" | "high" | "urgent";
    responseTarget: number; // minutes
    resolutionTarget: number; // minutes;
    createdAt: Date;
    updatedAt: Date;
}

const slaSchema = new Schema<ISLA>(
    {
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            required: true,
            unique: true,
        },

        responseTarget: {
            type: Number,
            required: true,
        },

        resolutionTarget: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);

export const SLA = model<ISLA>("SLA", slaSchema);