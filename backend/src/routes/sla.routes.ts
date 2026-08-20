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

router.get("/", authenticate, authorize("admin", "agent"), listSlaPoliciesController);

router.put(
    "/:priority",
    authenticate,
    authorize("admin"),
    validate(updateSlaSchema),
    updateSlaPolicyController,
);

export default router;
