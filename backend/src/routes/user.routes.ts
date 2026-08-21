import { Router } from "express";
import {
    deleteUserController,
    getUserController,
    listUsersController,
    updateUserController,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
    listUsersSchema,
    updateUserSchema,
    userIdParamSchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(authenticate, authorize("admin"));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users (admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [customer, agent, admin] }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: string, enum: [true, false] }
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
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/User"
 *                         pagination:
 *                           $ref: "#/components/schemas/Pagination"
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
 *       403:
 *         description: Forbidden (non-admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get("/", validate(listUsersSchema), listUsersController);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id (admin)
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
 *                       $ref: "#/components/schemas/User"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get("/:id", validate(userIdParamSchema), getUserController);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user (admin)
 *     description: Updates name/role/teamId. Cannot demote the last admin.
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
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               role: { type: string, enum: [customer, agent, admin] }
 *               teamId: { type: string, minLength: 1, maxLength: 100 }
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
 *                       $ref: "#/components/schemas/User"
 *       400:
 *         description: Validation / last-admin guard
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
router.put(
    "/:id",
    validate(updateUserSchema),
    updateUserController,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete a user (admin)
 *     description: Sets deleted=true. Blocked if user is referenced by active tickets or is the last admin.
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
 *         description: Validation / last-admin / active-ticket guard
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
    validate(userIdParamSchema),
    deleteUserController,
);

export default router;
