import { Router } from "express";
import { sendSuccess } from "../utils/response.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get("/health", (_req, res) => {
    sendSuccess(res, null, "Helpdesk API is running");
});

router.get("/health/protected", authenticate, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authentication successful",
        data: {
            user: req.user,
        },
    });
});

router.get("/health/admin", authenticate, authorize("admin"), (req, res) => {
        res.status(200).json({
            success: true,
            message: "Admin authorization successful",
            data: {
                user: req.user,
            },
        });
    },
);
export default router;