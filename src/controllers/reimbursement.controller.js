import { ReimbursementService } from "../services/reimbursement.service.js";

export class ReimbursementController {
  static async raise(req, res, next) {
    try {
      const employeeId = req.user.id;
      const { title, description, amount } = req.body;

      const claim = await ReimbursementService.raiseClaim({
        employeeId,
        title,
        description,
        amount,
      });

      return res.status(201).json({
        success: true,
        message: "Reimbursement claim raised successfully",
        data: { reimbursement: claim },
      });
    } catch (error) {
      next(error);
    }
  }

  static async patch(req, res, next) {
    try {
      const approverId = req.user.id;
      const approverRole = req.user.role;
      const { userId, status, comments } = req.body;

      const updated = await ReimbursementService.submitApproval({
        approverId,
        approverRole,
        employeeId: userId,
        status,
        comments,
      });

      return res.status(200).json({
        success: true,
        message: `Claim status updated successfully to ${updated.status}`,
        data: { reimbursement: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}
