import { Router } from "express";
import {
    listSlaPoliciesController,
    updateSlaPolicyController,
} from "../controllers/sla.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { updateSlaSchema } from "../validators/sla.validator.js";

const router = Router();

/**
 * @openapi
 * /sla:
 *   get:
 *     tags: [SLA]
 *     summary: List SLA policies
 *     description: Returns all 4 priorities with configured or default targets.
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
 *                         $ref: "#/components/schemas/SlaPolicy"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get(
    "/",
    authenticate,
    authorize("admin", "agent"),
    listSlaPoliciesController,
);

/**
 * @openapi
 * /sla/{priority}:
 *   put:
 *     tags: [SLA]
 *     summary: Upsert SLA policy for a priority (admin)
 *     parameters:
 *       - in: path
 *         name: priority
 *         required: true
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [responseTarget, resolutionTarget]
 *             properties:
 *               responseTarget: { type: integer, minimum: 1 }
 *               resolutionTarget: { type: integer, minimum: 1 }
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
 *                       $ref: "#/components/schemas/SlaPolicy"
 *       400:
 *         description: Validation error / resolution < response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.put(
    "/:priority",
    authenticate,
    authorize("admin"),
    validate(updateSlaSchema),
    updateSlaPolicyController,
);

export default router;
