import type { Request, Response, NextFunction } from "express";
import {
    createNewCategory,
    deleteExistingCategory,
    getCategoryById,
    listCategories,
    updateExistingCategory,
} from "../services/category.service.js";
import { sendSuccess } from "../utils/response.js";

export const listCategoriesController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const categories = await listCategories(req.query.status as
            | "active"
            | "inactive"
            | undefined);
        return sendSuccess(
            res,
            categories,
            "Categories retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const getCategoryController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const category = await getCategoryById(String(req.params.id));
        return sendSuccess(
            res,
            category,
            "Category retrieved successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const createCategoryController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const category = await createNewCategory(
            req.body.name,
            req.body.status,
        );
        return sendSuccess(
            res,
            category,
            "Category created successfully",
            201,
        );
    } catch (error) {
        next(error);
    }
};

export const updateCategoryController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const category = await updateExistingCategory(
            String(req.params.id),
            req.body,
        );
        return sendSuccess(
            res,
            category,
            "Category updated successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};

export const deleteCategoryController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await deleteExistingCategory(String(req.params.id));
        return sendSuccess(
            res,
            null,
            "Category deleted successfully",
            200,
        );
    } catch (error) {
        next(error);
    }
};
