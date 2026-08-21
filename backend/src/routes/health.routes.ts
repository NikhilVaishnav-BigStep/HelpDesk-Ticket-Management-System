import { Router } from "express";
import { sendSuccess } from "../utils/response.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns basic service liveness info.
 *     security: []
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SuccessEnvelope"
 */
/**
 * @openapi
 * /health/protected:
 *   get:
 *     tags: [Health]
 *     summary: Protected health check (auth required)
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SuccessEnvelope"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
/**
 * @openapi
 * /health/admin:
 *   get:
 *     tags: [Health]
 *     summary: Admin-only health check
 *     responses:
 *       200:
 *         description: Admin authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SuccessEnvelope"
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
const router = Router();

router.get("/health", (_req, res) => {
    sendSuccess(res, null, "Helpdesk API is running");
});

router.get("/health/protected", authenticate, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authentication successful",
        data: {
            user: req.user,
        },
    });
});

router.get("/health/admin", authenticate, authorize("admin"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin authorization successful",
        data: {
            user: req.user,
        },
    });
});
export default router;
