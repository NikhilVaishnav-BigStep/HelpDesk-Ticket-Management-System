import { Schema, model, type Document } from "mongoose";

export const USER_ROLES = ["customer", "agent", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    teamId?: string;
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
    },
    {
        timestamps: true,
    },
);

export const User = model<IUser>("User", userSchema);