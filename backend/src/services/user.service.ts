import { Types } from "mongoose";
import type { IUser, UserRole } from "../models/User.js";
import { AppException } from "../exceptions/AppException.js";
import {
    countActiveAdmins,
    findUserById,
    findUsers,
    isUserReferencedByActiveTickets,
    softDeleteUserById,
    updateUserById,
} from "../repositories/user.repository.js";

export interface ListUsersInput {
    page: number;
    limit: number;
    role?: UserRole;
    search?: string;
    includeDeleted?: boolean;
}

const stripPassword = (user: IUser) => {
    const obj = user.toObject();
    delete (obj as { password?: string }).password;
    return obj;
};

export const listUsers = async (input: ListUsersInput) => {
    const skip = (input.page - 1) * input.limit;
    const { users, total } = await findUsers(
        {
            role: input.role,
            search: input.search,
            includeDeleted: input.includeDeleted,
        },
        skip,
        input.limit,
    );

    return {
        users: users.map(stripPassword),
        pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
        },
    };
};

export const getUserByIdOrThrow = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppException("Invalid user id", 400);
    }
    const user = await findUserById(id);
    if (!user) {
        throw new AppException("User not found", 404);
    }
    return stripPassword(user);
};

export const updateUser = async (
    id: string,
    updates: { name?: string; role?: UserRole; teamId?: string },
) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppException("Invalid user id", 400);
    }

    const user = await findUserById(id);
    if (!user || user.deleted) {
        throw new AppException("User not found", 404);
    }

    const payload: { name?: string; role?: UserRole; teamId?: string } = {};
    if (updates.name !== undefined) {
        payload.name = updates.name;
    }
    if (updates.role !== undefined) {
        payload.role = updates.role;
    }
    if (updates.teamId !== undefined) {
        payload.teamId = updates.teamId;
    }

    if (payload.role !== undefined && payload.role !== user.role) {
        if (user.role === "admin" && payload.role !== "admin") {
            const adminCount = await countActiveAdmins();
            if (adminCount <= 1) {
                throw new AppException(
                    "Cannot demote the last remaining admin",
                    400,
                );
            }
        }
    }

    const updated = await updateUserById(id, payload);
    if (!updated) {
        throw new AppException("Failed to update user", 500);
    }
    return stripPassword(updated);
};

export const softDeleteUser = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppException("Invalid user id", 400);
    }

    const user = await findUserById(id);
    if (!user || user.deleted) {
        throw new AppException("User not found", 404);
    }

    if (user.role === "admin") {
        const adminCount = await countActiveAdmins();
        if (adminCount <= 1) {
            throw new AppException(
                "Cannot delete the last remaining admin",
                400,
            );
        }
    }

    const referenced = await isUserReferencedByActiveTickets(id);
    if (referenced) {
        throw new AppException(
            "Cannot delete user referenced by active tickets. Please reassign or close them first.",
            400,
        );
    }

    const deleted = await softDeleteUserById(id);
    if (!deleted) {
        throw new AppException("Failed to delete user", 500);
    }
    return stripPassword(deleted);
};
