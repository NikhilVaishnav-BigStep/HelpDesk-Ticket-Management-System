import { Schema, model, type Document, type Types } from "mongoose";

export enum TicketPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent",
}

export enum TicketStatus {
    OPEN = "open",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    CLOSED = "closed",
}

export interface ITicket extends Document {
    customerId: Types.ObjectId;
    assigneeId?: Types.ObjectId;
    categoryId?: Types.ObjectId;
    priority: TicketPriority;
    status: TicketStatus;
    subject: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        assigneeId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
            index: true,
        },

        priority: {
            type: String,
            enum: Object.values(TicketPriority),
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: Object.values(TicketStatus),
            default: TicketStatus.OPEN,
            required: true,
            index: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

ticketSchema.index({ customerId: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ assigneeId: 1, status: 1 });

export const Ticket = model<ITicket>("Ticket", ticketSchema);