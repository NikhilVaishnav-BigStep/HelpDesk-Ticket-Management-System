import { Router } from "express";
import { createTicket, getTicket, getTicketList } from "../controllers/ticket.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createTicketSchema, listTicketsSchema } from "../validators/ticket.validator.js";

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

export default router;