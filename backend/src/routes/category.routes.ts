import { Router } from "express";
import {
    createCategoryController,
    deleteCategoryController,
    getCategoryController,
    listCategoriesController,
    updateCategoryController,
} from "../controllers/category.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
    categoryIdParamSchema,
    createCategorySchema,
    listCategoriesSchema,
    updateCategorySchema,
} from "../validators/category.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    validate(listCategoriesSchema),
    listCategoriesController,
);

router.post(
    "/",
    authenticate,
    authorize("admin"),
    validate(createCategorySchema),
    createCategoryController,
);

router.get(
    "/:id",
    authenticate,
    validate(categoryIdParamSchema),
    getCategoryController,
);

router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    validate(updateCategorySchema),
    updateCategoryController,
);

router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    validate(categoryIdParamSchema),
    deleteCategoryController,
);

export default router;
