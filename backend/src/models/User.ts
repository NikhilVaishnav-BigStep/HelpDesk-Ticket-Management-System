import { Schema, model, type Document } from "mongoose";

export const USER_ROLES = ["customer", "agent", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    teamId?: string;
    deleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: USER_ROLES,
            required: true,
            default: "customer",
        },

        teamId: {
            type: String,
            default: null,
        },

        deleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

userSchema.index({ deleted: 1, role: 1 });

export const User = model<IUser>("User", userSchema);