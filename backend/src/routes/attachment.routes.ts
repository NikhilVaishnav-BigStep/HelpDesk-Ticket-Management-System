import { Router } from "express";
import {
    downloadAttachmentController,
    getAttachmentMetadataController,
} from "../controllers/attachment.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.get(
    "/:id",
    authenticate,
    getAttachmentMetadataController,
);

router.get(
    "/:id/download",
    authenticate,
    downloadAttachmentController,
);

export default router;