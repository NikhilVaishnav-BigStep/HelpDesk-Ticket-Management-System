import { Types } from "mongoose";
import {
    createCategory,
    deleteCategoryById,
    findCategories,
    findCategoryById,
    findCategoryByName,
    isCategoryReferencedByTickets,
    updateCategoryById,
} from "../repositories/category.repository.js";
import type { ICategory } from "../models/Category.js";
import { AppException } from "../exceptions/AppException.js";

export const listCategories = async (
    status?: "active" | "inactive",
): Promise<ICategory[]> => {
    return findCategories(status);
};

export const getCategoryById = async (
    id: string,
): Promise<ICategory> => {
    const category = await findCategoryById(id);
    if (!category) {
        throw new AppException("Category not found", 404);
    }
    return category;
};

export const createNewCategory = async (
    name: string,
    status: "active" | "inactive" = "active",
): Promise<ICategory> => {
    const existing = await findCategoryByName(name);
    if (existing) {
        throw new AppException(
            "A category with this name already exists",
            409,
        );
    }

    return createCategory({ name, status });
};

export const updateExistingCategory = async (
    id: string,
    updates: { name?: string; status?: "active" | "inactive" },
): Promise<ICategory> => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppException("Invalid category id", 400);
    }

    const category = await findCategoryById(id);
    if (!category) {
        throw new AppException("Category not found", 404);
    }

    if (updates.name !== undefined && updates.name !== category.name) {
        const duplicate = await findCategoryByName(updates.name);
        if (duplicate && duplicate._id.toString() !== id) {
            throw new AppException(
                "A category with this name already exists",
                409,
            );
        }
    }

    const updated = await updateCategoryById(id, updates);
    if (!updated) {
        throw new AppException("Failed to update category", 500);
    }
    return updated;
};

export const deleteExistingCategory = async (
    id: string,
): Promise<void> => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppException("Invalid category id", 400);
    }

    const category = await findCategoryById(id);
    if (!category) {
        throw new AppException("Category not found", 404);
    }

    const inUse = await isCategoryReferencedByTickets(id);
    if (inUse) {
        throw new AppException(
            "Cannot delete category referenced by existing tickets. Please set its status to inactive instead.",
            400,
        );
    }

    await deleteCategoryById(id);
};
