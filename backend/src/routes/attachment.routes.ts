import { Router } from "express";
import {
    downloadAttachmentController,
    getAttachmentMetadataController,
} from "../controllers/attachment.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

/**
 * @openapi
 * /attachments/{id}:
 *   get:
 *     tags: [Attachments]
 *     summary: Get attachment metadata
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
 *                       $ref: "#/components/schemas/Attachment"
 *       403:
 *         description: Forbidden
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
router.get(
    "/:id",
    authenticate,
    getAttachmentMetadataController,
);

/**
 * @openapi
 * /attachments/{id}/download:
 *   get:
 *     tags: [Attachments]
 *     summary: Download attachment file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Binary file stream
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Forbidden
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
router.get(
    "/:id/download",
    authenticate,
    downloadAttachmentController,
);

export default router;
