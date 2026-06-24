import { Router } from "express";
import { ReimbursementController } from "../controllers/reimbursement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Raise claim: restricted to EMP only
router.post("/", authenticate, authorizeRoles("EMP"), ReimbursementController.raise);

// Approve/Reject claim: restricted to RM, APE, and CFO
router.patch("/", authenticate, authorizeRoles("RM", "APE", "CFO"), ReimbursementController.patch);

export default router;
