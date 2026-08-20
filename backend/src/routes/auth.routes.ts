import { Router } from "express";
import { adminCreateUserController, login, register } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { adminCreateUserSchema, loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

router.post(
    "/users",
    authenticate,
    authorize("admin"),
    validate(adminCreateUserSchema),
    adminCreateUserController,
);

export default router;