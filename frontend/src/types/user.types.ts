export type UserRole = "customer" | "agent" | "admin";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    teamId: string | null;
    deleted: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}