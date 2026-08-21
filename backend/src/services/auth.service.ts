import {
    createUser,
    findUserByEmail,
    findUserById,
    updateUserPasswordById,
} from "../repositories/user.repository.js";
import { AppException } from "../exceptions/AppException.js";
import type { UserRole } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
}

interface AdminCreateUserInput {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    teamId?: string;
}

interface LoginUserInput {
    email: string;
    password: string;
}

export const registerUser = async ({
    name,
    email,
    password,
}: RegisterUserInput) => {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new AppException("Email is already registered", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await createUser({
        name,
        email,
        password: hashedPassword,
        role: "customer",
    });

    return user;
};

export const adminCreateUser = async ({
    name,
    email,
    password,
    role,
    teamId,
}: AdminCreateUserInput) => {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new AppException("Email is already registered", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await createUser({
        name,
        email,
        password: hashedPassword,
        role,
        teamId,
    });

    return user;
};

export const loginUser = async ({
    email,
    password,
}: LoginUserInput) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new AppException("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(
        password,
        user.password,
    );

    if (!isPasswordValid) {
        throw new AppException("Invalid email or password", 401);
    }

    const userId = user._id.toString();

    const token = generateToken({
        userId,
        role: user.role,
    });

    return {
        token,
        user: {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
        },
    };
};

export const changeOwnPassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string,
): Promise<void> => {
    const user = await findUserById(userId);

    if (!user || user.deleted) {
        throw new AppException("User not found", 404);
    }

    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) {
        throw new AppException("Current password is incorrect", 401);
    }

    const hashed = await hashPassword(newPassword);
    await updateUserPasswordById(userId, hashed);
};

export const resetUserPassword = async (
    targetUserId: string,
    newPassword: string,
): Promise<void> => {
    const user = await findUserById(targetUserId);

    if (!user || user.deleted) {
        throw new AppException("User not found", 404);
    }

    const hashed = await hashPassword(newPassword);
    await updateUserPasswordById(targetUserId, hashed);
};