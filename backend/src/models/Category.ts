import { Schema, model, type Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true },
);

export const Category = model<ICategory>("Category", categorySchema);