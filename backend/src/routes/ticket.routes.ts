import { Router } from "express";
import {
    addCommentController,
    assignTicketController,
    bulkAssignTicketsController,
    bulkChangeStatusController,
    changeStatusController,
    createTicket,
    getTicket,
    getTicketList,
    getTicketTimelineController,
    listCommentsController,
    listHistoryController,
    reopenTicketController,
    updateTicketController,
} from "../controllers/ticket.controller.js";
import { uploadAttachmentController } from "../controllers/attachment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
    addCommentSchema,
    assignTicketSchema,
    changeStatusSchema,
    createTicketSchema,
    listTicketsSchema,
    updateTicketSchema,
} from "../validators/ticket.validator.js";
import {
    bulkAssignSchema,
    bulkChangeStatusSchema,
} from "../validators/bulk.validator.js";

const router = Router();

/**
 * @openapi
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a ticket (customer)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description]
 *             properties:
 *               subject: { type: string, minLength: 1, maxLength: 200 }
 *               description: { type: string, minLength: 1 }
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               categoryId: { type: string }
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
 *                       $ref: "#/components/schemas/Ticket"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       403:
 *         description: Forbidden (non-customer)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.post(
    "/",
    authenticate,
    authorize("customer"),
    validate(createTicketSchema),
    createTicket,
);

/**
 * @openapi
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Search and filter tickets
 *     description: |
 *       Returns paginated tickets. Customers see only their own tickets.
 *       Supports filtering by status, priority, assignee, category, date range,
 *       and full-text search on subject/description.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, assigned, in_progress, resolved, closed] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: assigneeId
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 200 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, priority, status], default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
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
 *                         tickets:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/Ticket"
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
 */
router.get(
    "/",
    authenticate,
    validate(listTicketsSchema),
    getTicketList,
);

/**
 * @openapi
 * /tickets/bulk/assign:
 *   post:
 *     tags: [Bulk]
 *     summary: Bulk-assign tickets
 *     description: Agent/admin only. Returns per-ticket results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketIds, assigneeId]
 *             properties:
 *               ticketIds:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items: { type: string }
 *               assigneeId: { type: string }
 *     responses:
 *       200:
 *         description: Per-ticket results
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/BulkResult"
 *       400:
 *         description: Validation error or invalid assignee
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
router.post(
    "/bulk/assign",
    authenticate,
    authorize("agent", "admin"),
    validate(bulkAssignSchema),
    bulkAssignTicketsController,
);

/**
 * @openapi
 * /tickets/bulk/status:
 *   post:
 *     tags: [Bulk]
 *     summary: Bulk-change ticket status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketIds, status]
 *             properties:
 *               ticketIds:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items: { type: string }
 *               status:
 *                 type: string
 *                 enum: [open, assigned, in_progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Per-ticket results
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/BulkResult"
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
router.post(
    "/bulk/status",
    authenticate,
    authorize("agent", "admin"),
    validate(bulkChangeStatusSchema),
    bulkChangeStatusController,
);

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get ticket by id
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
 *                       $ref: "#/components/schemas/Ticket"
 *       403:
 *         description: Forbidden (not owner)
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
    getTicket,
);

/**
 * @openapi
 * /tickets/{id}/timeline:
 *   get:
 *     tags: [Timeline]
 *     summary: Get unified ticket timeline
 *     description: |
 *       Returns comments + history + attachments merged and sorted ASC by
 *       createdAt. Customers see only external comments and no history.
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
 *                       $ref: "#/components/schemas/TicketTimeline"
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
    "/:id/timeline",
    authenticate,
    getTicketTimelineController,
);

/**
 * @openapi
 * /tickets/{id}:
 *   put:
 *     tags: [Tickets]
 *     summary: Update ticket (agent/admin)
 *     description: Updates subject/description/priority/category. Closed tickets cannot be updated.
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
 *               subject: { type: string, minLength: 1, maxLength: 200 }
 *               description: { type: string, minLength: 1 }
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               categoryId: { type: string }
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
 *                       $ref: "#/components/schemas/Ticket"
 *       400:
 *         description: Validation error or closed ticket
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
router.put(
    "/:id",
    authenticate,
    authorize("agent", "admin"),
    validate(updateTicketSchema),
    updateTicketController,
);

/**
 * @openapi
 * /tickets/{id}/assign:
 *   put:
 *     tags: [Tickets]
 *     summary: Assign ticket (agent/admin)
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
 *             required: [assigneeId]
 *             properties:
 *               assigneeId: { type: string }
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
 *                       $ref: "#/components/schemas/Ticket"
 *       400:
 *         description: Validation error / closed ticket / customer assignee
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
    "/:id/assign",
    authenticate,
    authorize("agent", "admin"),
    validate(assignTicketSchema),
    assignTicketController,
);

/**
 * @openapi
 * /tickets/{id}/status:
 *   put:
 *     tags: [Tickets]
 *     summary: Change ticket status (agent/admin)
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, assigned, in_progress, resolved, closed]
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
 *                       $ref: "#/components/schemas/Ticket"
 *       400:
 *         description: Validation error / invalid transition / closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.put(
    "/:id/status",
    authenticate,
    authorize("agent", "admin"),
    validate(changeStatusSchema),
    changeStatusController,
);

/**
 * @openapi
 * /tickets/{id}/reopen:
 *   post:
 *     tags: [Tickets]
 *     summary: Reopen a closed ticket (agent/admin)
 *     description: Transitions CLOSED → IN_PROGRESS and recomputes SLA due dates.
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
 *                       $ref: "#/components/schemas/Ticket"
 *       400:
 *         description: Ticket not closed
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
router.post(
    "/:id/reopen",
    authenticate,
    authorize("agent", "admin"),
    reopenTicketController,
);

/**
 * @openapi
 * /tickets/{id}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment
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
 *             required: [message]
 *             properties:
 *               message: { type: string, minLength: 1, maxLength: 5000 }
 *               type:
 *                 type: string
 *                 enum: [external, internal]
 *                 default: external
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
 *                       $ref: "#/components/schemas/Comment"
 *       400:
 *         description: Validation error / closed ticket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       403:
 *         description: Forbidden (customer adding internal)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.post(
    "/:id/comments",
    authenticate,
    validate(addCommentSchema),
    addCommentController,
);

/**
 * @openapi
 * /tickets/{id}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a ticket
 *     description: Customers see only external comments. Agents/admins see all.
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
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/Comment"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get(
    "/:id/comments",
    authenticate,
    listCommentsController,
);

/**
 * @openapi
 * /tickets/{id}/history:
 *   get:
 *     tags: [History]
 *     summary: Get ticket audit history (agent/admin)
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
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/TicketHistory"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get(
    "/:id/history",
    authenticate,
    authorize("agent", "admin"),
    listHistoryController,
);

/**
 * @openapi
 * /tickets/{id}/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload an attachment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/SuccessEnvelope"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Attachment"
 *       400:
 *         description: Validation error / closed ticket
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
router.post(
    "/:id/attachments",
    authenticate,
    upload.single("file"),
    uploadAttachmentController,
);

export default router;
