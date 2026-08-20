import { Schema, model, type Document, type Types } from "mongoose";

export interface ITicketHistory extends Document {
    ticketId: Types.ObjectId;
    actorId: Types.ObjectId;
    action: "status_change" | "assign" | "priority_change" | "comment" | "reopen" | "close" | "sla_breach" | "other";
    oldValue: string | null;
    newValue: string | null;
    createdAt: Date;
}

const ticketHistorySchema = new Schema<ITicketHistory>(
    {
        ticketId: {
            type: Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
            index: true,
        },

        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            enum: [
                "status_change",
                "assign",
                "priority_change",
                "comment",
                "reopen",
                "close",
                "sla_breach",
                "other",
            ],
            required: true,
        },

        oldValue: {
            type: String,
            default: null,
        },

        newValue: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

ticketHistorySchema.index({ ticketId: 1, createdAt: 1 });

export const TicketHistory = model<ITicketHistory>("TicketHistory", ticketHistorySchema);