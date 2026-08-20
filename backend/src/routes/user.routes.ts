import { Router } from "express";
import {
    deleteUserController,
    getUserController,
    listUsersController,
    updateUserController,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
    listUsersSchema,
    updateUserSchema,
    userIdParamSchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", validate(listUsersSchema), listUsersController);

router.get("/:id", validate(userIdParamSchema), getUserController);

router.put("/:id", validate(updateUserSchema), updateUserController);

router.delete("/:id", validate(userIdParamSchema), deleteUserController);

export default router;
