import { User, type IUser } from "../models/User.js";

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
    return User.findById(id).exec();
};