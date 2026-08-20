import { Router } from "express";
import {
    addCommentController,
    assignTicketController,
    changeStatusController,
    createTicket,
    getTicket,
    getTicketList,
    listCommentsController,
    listHistoryController,
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

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("customer"),
    validate(createTicketSchema),
    createTicket,
);

router.get(
    "/",
    authenticate,
    validate(listTicketsSchema),
    getTicketList,
);

router.get(
    "/:id",
    authenticate,
    getTicket,
);

router.put(
    "/:id",
    authenticate,
    authorize("agent", "admin"),
    validate(updateTicketSchema),
    updateTicketController,
);

router.put(
    "/:id/assign",
    authenticate,
    authorize("agent", "admin"),
    validate(assignTicketSchema),
    assignTicketController,
);

router.put(
    "/:id/status",
    authenticate,
    authorize("agent", "admin"),
    validate(changeStatusSchema),
    changeStatusController,
);

router.post(
    "/:id/comments",
    authenticate,
    validate(addCommentSchema),
    addCommentController,
);

router.get(
    "/:id/comments",
    authenticate,
    listCommentsController,
);

router.get(
    "/:id/history",
    authenticate,
    authorize("agent", "admin"),
    listHistoryController,
);

router.post(
    "/:id/attachments",
    authenticate,
    upload.single("file"),
    uploadAttachmentController,
);

export default router;