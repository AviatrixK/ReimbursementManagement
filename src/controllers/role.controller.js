import { RoleService } from "../services/role.service.js";

export class RoleController {
  static async assign(req, res, next) {
    try {
      const { userId, role } = req.body;
      const updatedUser = await RoleService.assignRole({ userId, role });
      return res.status(200).json({
        success: true,
        message: "Role assigned successfully",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }
}
