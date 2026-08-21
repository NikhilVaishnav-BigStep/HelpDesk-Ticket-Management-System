import { Types } from "mongoose";
import { User, USER_ROLES, type IUser, type UserRole } from "../models/User.js";
import { Ticket, TicketStatus } from "../models/Ticket.js";

export const createUser = async (
    userData: Pick<IUser, "name" | "email" | "password" | "role" | "teamId">,
): Promise<IUser> => {
    return User.create(userData);
};

export const findUserByEmail = async (
    email: string,
): Promise<IUser | null> => {
    return User.findOne({ email }).exec();
};

export const findUserById = async (id: string): Promise<IUser | null> => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }
    return User.findById(id).exec();
};

export interface UserFilter {
    role?: UserRole;
    search?: string;
    includeDeleted?: boolean;
}

const escapeRegex = (input: string): string =>
    input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const findUsers = async (
    filter: UserFilter,
    skip: number,
    limit: number,
) => {
    const query: Record<string, unknown> = {};

    if (!filter.includeDeleted) {
        query.deleted = { $ne: true };
    }

    if (filter.role) {
        query.role = filter.role;
    }

    if (filter.search) {
        const safe = escapeRegex(filter.search.trim());
        const re = new RegExp(safe, "i");
        query.$or = [{ name: re }, { email: re }];
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(query),
    ]);

    return { users, total };
};

export const findUsersByRole = async (
    role: UserRole,
): Promise<IUser[]> => {
    return User.find({ role, deleted: { $ne: true } }).exec();
};

export const countActiveAdmins = async (): Promise<number> => {
    return User.countDocuments({ role: "admin", deleted: { $ne: true } });
};

export const updateUserById = async (
    id: string,
    updateData: Partial<Pick<IUser, "name" | "role" | "teamId">>,
): Promise<IUser | null> => {
    return User.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deleted: { $ne: true } },
        { $set: updateData },
        { new: true, runValidators: true },
    ).exec();
};

export const updateUserPasswordById = async (
    id: string,
    hashedPassword: string,
): Promise<IUser | null> => {
    return User.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deleted: { $ne: true } },
        { $set: { password: hashedPassword } },
        { new: true },
    ).exec();
};

export const softDeleteUserById = async (
    id: string,
): Promise<IUser | null> => {
    return User.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deleted: { $ne: true } },
        { $set: { deleted: true, deletedAt: new Date() } },
        { new: true },
    ).exec();
};

export const isUserReferencedByActiveTickets = async (
    userId: string,
): Promise<boolean> => {
    if (!Types.ObjectId.isValid(userId)) {
        return false;
    }
    const oid = new Types.ObjectId(userId);
    const count = await Ticket.countDocuments({
        $or: [{ customerId: oid }, { assigneeId: oid }],
        status: {
            $nin: [TicketStatus.CLOSED, TicketStatus.RESOLVED],
        },
    });
    return count > 0;
};

export { USER_ROLES };
