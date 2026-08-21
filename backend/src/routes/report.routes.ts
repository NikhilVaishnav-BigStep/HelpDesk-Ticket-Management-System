import { Router } from "express";
import { getTicketReportsController } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ticketReportSchema } from "../validators/report.validator.js";

const router = Router();

/**
 * @openapi
 * /reports/tickets:
 *   get:
 *     tags: [Reports]
 *     summary: Ticket metrics (admin)
 *     description: Aggregated counts, breach rate, avg response/resolution times, by-priority, by-status, by-category.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: categoryId
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
 *                       $ref: "#/components/schemas/TicketReport"
 *       400:
 *         description: Validation error
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
    "/tickets",
    authenticate,
    authorize("admin"),
    validate(ticketReportSchema),
    getTicketReportsController,
);

export default router;
