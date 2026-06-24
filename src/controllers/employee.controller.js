import { EmployeeService } from "../services/employee.service.js";

export class EmployeeController {
  static async assign(req, res, next) {
    try {
      const { userId, managerId } = req.body;
      const updatedEmployee = await EmployeeService.assignManager({ userId, managerId });
      return res.status(200).json({
        success: true,
        message: "Reporting manager assigned successfully",
        data: { employee: updatedEmployee },
      });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      const { userId, managerId } = req.body;
      const updatedEmployee = await EmployeeService.removeManager({ userId, managerId });
      return res.status(200).json({
        success: true,
        message: "Reporting manager assignment removed successfully",
        data: { employee: updatedEmployee },
      });
    } catch (error) {
      next(error);
    }
  }
}
