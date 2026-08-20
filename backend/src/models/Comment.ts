import { Schema, model, type Document, type Types } from "mongoose";

export interface IComment extends Document {
    ticketId: Types.ObjectId;
    authorId: Types.ObjectId;
    type: "external" | "internal";
    message: string;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        ticketId: {
            type: Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
            index: true,
        },

        authorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["external", "internal"],
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true },
);

commentSchema.index({ ticketId: 1, createdAt: 1 });

export const Comment = model<IComment>("Comment", commentSchema);