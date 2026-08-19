import { createUser, findUserByEmail } from "../repositories/user.repository.js";
import { AppException } from "../exceptions/AppException.js";
import type { UserRole } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
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
    role = "customer",
    teamId,
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