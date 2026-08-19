import { hashPassword } from "../utils/password.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";
import { AppException } from "../exceptions/AppException.js";
import type { UserRole } from "../models/User.js";

interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    teamId?: string;
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