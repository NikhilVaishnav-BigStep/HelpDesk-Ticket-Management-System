import { Router } from "express";
import { getTicketReportsController } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ticketReportSchema } from "../validators/report.validator.js";

const router = Router();

router.get(
    "/tickets",
    authenticate,
    authorize("admin"),
    validate(ticketReportSchema),
    getTicketReportsController,
);

export default router;
