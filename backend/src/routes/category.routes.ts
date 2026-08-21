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

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/Category"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get(
    "/",
    authenticate,
    validate(listCategoriesSchema),
    listCategoriesController,
);

/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Category"
 *       409:
 *         description: Duplicate name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.post(
    "/",
    authenticate,
    authorize("admin"),
    validate(createCategorySchema),
    createCategoryController,
);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Category"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get(
    "/:id",
    authenticate,
    validate(categoryIdParamSchema),
    getCategoryController,
);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Category"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       409:
 *         description: Duplicate name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    validate(updateCategorySchema),
    updateCategoryController,
);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (admin)
 *     description: Blocked if the category is referenced by any ticket.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SuccessEnvelope"
 *       400:
 *         description: Category in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    validate(categoryIdParamSchema),
    deleteCategoryController,
);

export default router;
