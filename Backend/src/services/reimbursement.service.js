import { db } from "../config/db.js";
import { reimbursements, reimbursementApprovals, users } from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";

export class ReimbursementService {
  static async raiseClaim({ employeeId, title, description, amount }) {
    if (!title || !description || !amount) {
      throw new Error("title, description, and amount are required");
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("amount must be a positive number");
    }

    // Insert the reimbursement with PENDING status
    const [claim] = await db
      .insert(reimbursements)
      .values({
        employeeId,
        title,
        description,
        amount: numericAmount.toFixed(2),
        status: "PENDING",
      })
      .returning();

    return claim;
  }

  static async evaluateStatus(reimbursementId, employeeId) {
    // 1. Fetch employee's manager
    const [employee] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
    if (!employee) return "PENDING";

    const managerId = employee.reportingManagerId;

    // 2. Fetch all approvals/actions for this reimbursement
    const approvals = await db
      .select()
      .from(reimbursementApprovals)
      .where(eq(reimbursementApprovals.reimbursementId, reimbursementId));

    // Check for explicit rejection
    const hasRejection = approvals.some(app => app.status === "REJECTED");
    if (hasRejection) {
      return "REJECTED";
    }

    // A reimbursement turns APPROVED only once both their designated RM and at least one APE have explicitly approved it.
    // If the employee does not have a designated RM assigned, we can check if there's any approval by their manager,
    // or if managerId is null, we might treat it as waiting or waived.
    // Let's assume having a designated RM is mandatory or check if the RM ID matches the approver ID.
    const rmApproved = approvals.some(app => app.approverId === managerId && app.status === "APPROVED");
    const apeApproved = approvals.some(app => app.role === "APE" && app.status === "APPROVED");

    // CFO action acting as either RM or APE (CFO can do anything, but let's count CFO as APE or direct approver if needed)
    // To be safe and adhere strictly to "both their designated RM AND at least one APE":
    // If CFO approved, we can count it towards APE approval layer.
    const cfoApproved = approvals.some(app => app.role === "CFO" && app.status === "APPROVED");

    const satisfiesApeLayer = apeApproved || cfoApproved;

    if (rmApproved && satisfiesApeLayer) {
      return "APPROVED";
    }

    return "PENDING";
  }

  static async submitApproval({ approverId, approverRole, employeeId, status, comments }) {
    if (!employeeId || !status) {
      throw new Error("userId and status are required");
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new Error("status must be APPROVED or REJECTED");
    }

    // 1. Find the latest PENDING reimbursement raised by this employee
    const [reimbursement] = await db
      .select()
      .from(reimbursements)
      .where(and(eq(reimbursements.employeeId, employeeId), eq(reimbursements.status, "PENDING")))
      .orderBy(desc(reimbursements.createdAt))
      .limit(1);

    if (!reimbursement) {
      const error = new Error("No pending reimbursement found for this user");
      error.status = 404;
      throw error;
    }

    // 2. Perform validation checks based on role
    // Fetch target employee details to identify their designated RM
    const [employee] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
    if (approverRole === "RM" && employee.reportingManagerId !== approverId) {
      throw new Error("You are not the designated reporting manager for this employee");
    }

    // 3. Upsert approval action signature
    // Check if this approver has already signed this reimbursement
    const [existingApproval] = await db
      .select()
      .from(reimbursementApprovals)
      .where(
        and(
          eq(reimbursementApprovals.reimbursementId, reimbursement.id),
          eq(reimbursementApprovals.approverId, approverId)
        )
      )
      .limit(1);

    if (existingApproval) {
      // Update signature
      await db
        .update(reimbursementApprovals)
        .set({ status, comments, createdAt: new Date() })
        .where(eq(reimbursementApprovals.id, existingApproval.id));
    } else {
      // Insert signature
      await db.insert(reimbursementApprovals).values({
        reimbursementId: reimbursement.id,
        approverId,
        role: approverRole,
        status,
        comments,
      });
    }

    // 4. Recalculate composite state status
    const compositeStatus = await this.evaluateStatus(reimbursement.id, employeeId);

    // 5. Update main reimbursement status
    const [updatedReimbursement] = await db
      .update(reimbursements)
      .set({ status: compositeStatus, updatedAt: new Date() })
      .where(eq(reimbursements.id, reimbursement.id))
      .returning();

    return updatedReimbursement;
  }

  static async getReimbursementQueue(userId, userRole) {
    if (userRole === "EMP") {
      // EMP sees only their own claims
      return db
        .select()
        .from(reimbursements)
        .where(eq(reimbursements.employeeId, userId))
        .orderBy(desc(reimbursements.createdAt));
    }

    if (userRole === "RM") {
      // RM sees claims that are PENDING from their direct subordinate EMPs
      return db
        .select({
          id: reimbursements.id,
          employeeId: reimbursements.employeeId,
          title: reimbursements.title,
          amount: reimbursements.amount,
          description: reimbursements.description,
          status: reimbursements.status,
          createdAt: reimbursements.createdAt,
          updatedAt: reimbursements.updatedAt,
        })
        .from(reimbursements)
        .innerJoin(users, eq(reimbursements.employeeId, users.id))
        .where(
          and(
            eq(reimbursements.status, "PENDING"),
            eq(users.role, "EMP"),
            eq(users.reportingManagerId, userId)
          )
        )
        .orderBy(desc(reimbursements.createdAt));
    }

    if (userRole === "APE") {
      // APE sees claims PENDING at the APE level but already APPROVED by the employee's RM
      // (To verify RM approved, we find approvals where status = 'APPROVED' and approverId is equal to employee's reporting manager)
      const allPending = await db
        .select({
          reimbursement: reimbursements,
          managerId: users.reportingManagerId,
        })
        .from(reimbursements)
        .innerJoin(users, eq(reimbursements.employeeId, users.id))
        .where(eq(reimbursements.status, "PENDING"));

      const filtered = [];
      for (const item of allPending) {
        const rId = item.reimbursement.id;
        const managerId = item.managerId;

        // Verify if designated RM approved it
        const approvals = await db
          .select()
          .from(reimbursementApprovals)
          .where(
            and(
              eq(reimbursementApprovals.reimbursementId, rId),
              eq(reimbursementApprovals.approverId, managerId),
              eq(reimbursementApprovals.status, "APPROVED")
            )
          )
          .limit(1);

        if (approvals.length > 0) {
          filtered.push(item.reimbursement);
        }
      }
      return filtered;
    }

    if (userRole === "CFO") {
      // CFO sees claims already APPROVED by the APEs (contains approval entry by APE role)
      const approvals = await db
        .select({ reimbursementId: reimbursementApprovals.reimbursementId })
        .from(reimbursementApprovals)
        .where(
          and(
            eq(reimbursementApprovals.role, "APE"),
            eq(reimbursementApprovals.status, "APPROVED")
          )
        );

      const reimbursementIds = approvals.map(a => a.reimbursementId);
      if (reimbursementIds.length === 0) return [];

      // Drizzle inArray check
      return db
        .select()
        .from(reimbursements)
        .where(inArray(reimbursements.id, reimbursementIds))
        .orderBy(desc(reimbursements.createdAt));
    }

    return [];
  }

  static async getSubordinateClaims(requesterId, requesterRole, targetUserId) {
    if (!targetUserId) {
      throw new Error("userId parameter is required");
    }

    // 1. Verify targeted user exists
    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) {
      const error = new Error("Target user not found");
      error.status = 404;
      throw error;
    }

    // 2. Rule: Only accessible if that targeted user is an EMP AND is a direct subordinate of the requesting user.
    if (targetUser.role !== "EMP" || targetUser.reportingManagerId !== requesterId) {
      const error = new Error("Forbidden: Target user is not a direct subordinate of the requester");
      error.status = 403;
      throw error;
    }

    // 3. List all claims
    return db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.employeeId, targetUserId))
      .orderBy(desc(reimbursements.createdAt));
  }
}
