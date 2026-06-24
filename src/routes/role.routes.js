import { Router } from "express";
import { RoleController } from "../controllers/role.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/assign", authenticate, authorizeRoles("CFO"), RoleController.assign);

export default router;
