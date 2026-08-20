import { Schema, model, type Document, type Types } from "mongoose";

export interface IAttachment extends Document {
    ticketId: Types.ObjectId;
    uploadedBy: Types.ObjectId;
    fileName: string;
    storageKey: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
    {
        ticketId: {
            type: Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
            index: true,
        },

        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        fileName: {
            type: String,
            required: true,
        },

        storageKey: {
            type: String,
            required: true,
        },

        mimeType: {
            type: String,
            required: true,
        },

        size: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);

attachmentSchema.index({ ticketId: 1, createdAt: -1 });

export const Attachment = model<IAttachment>("Attachment", attachmentSchema);