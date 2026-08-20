import { Types } from "mongoose";
import { Category, type ICategory } from "../models/Category.js";
import { Ticket } from "../models/Ticket.js";

export const findCategories = async (
    status?: "active" | "inactive",
): Promise<ICategory[]> => {
    const query: Record<string, unknown> = {};
    if (status) {
        query.status = status;
    }
    return Category.find(query).sort({ name: 1 }).exec();
};

export const findCategoryById = async (
    id: string,
): Promise<ICategory | null> => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }
    return Category.findById(id).exec();
};

export const findCategoryByName = async (
    name: string,
): Promise<ICategory | null> => {
    return Category.findOne({
        name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    }).exec();
};

export const createCategory = async (
    data: Pick<ICategory, "name" | "status">,
): Promise<ICategory> => {
    return Category.create(data);
};

export const updateCategoryById = async (
    id: string,
    updateData: Partial<Pick<ICategory, "name" | "status">>,
): Promise<ICategory | null> => {
    return Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).exec();
};

export const deleteCategoryById = async (
    id: string,
): Promise<ICategory | null> => {
    return Category.findByIdAndDelete(id).exec();
};

export const isCategoryReferencedByTickets = async (
    categoryId: string,
): Promise<boolean> => {
    const count = await Ticket.countDocuments({
        categoryId: new Types.ObjectId(categoryId),
    });
    return count > 0;
};
