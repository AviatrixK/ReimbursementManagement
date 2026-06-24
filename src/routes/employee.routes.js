import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/assign", authenticate, authorizeRoles("CFO"), EmployeeController.assign);
router.delete("/assign", authenticate, authorizeRoles("CFO"), EmployeeController.remove);

export default router;
