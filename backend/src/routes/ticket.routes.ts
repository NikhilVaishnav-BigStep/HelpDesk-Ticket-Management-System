import { Router } from "express";
import { createTicket, getTicket, getTicketList, updateTicketController } from "../controllers/ticket.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createTicketSchema, listTicketsSchema, updateTicketSchema } from "../validators/ticket.validator.js";

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

export default router;