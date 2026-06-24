import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";

export class EmployeeService {
  static async assignManager({ userId, managerId }) {
    if (!userId || !managerId) {
      throw new Error("userId and managerId are required");
    }

    // 1. Verify target employee exists and is an EMP
    const [employee] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!employee) {
      const error = new Error("Target employee user not found");
      error.status = 404;
      throw error;
    }
    if (employee.role !== "EMP") {
      throw new Error("Manager reporting assignments can only be set on users with the 'EMP' role");
    }

    // 2. Verify target manager exists and is a RM
    const [manager] = await db.select().from(users).where(eq(users.id, managerId)).limit(1);
    if (!manager) {
      const error = new Error("Target manager user not found");
      error.status = 404;
      throw error;
    }
    if (manager.role !== "RM") {
      throw new Error("Manager reporting assignments must point to a user with the 'RM' role");
    }

    // 3. Update the reporting manager
    const [updatedEmployee] = await db
      .update(users)
      .set({ reportingManagerId: managerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        reportingManagerId: users.reportingManagerId,
        updatedAt: users.updatedAt,
      });

    return updatedEmployee;
  }

  static async removeManager({ userId, managerId }) {
    if (!userId || !managerId) {
      throw new Error("userId and managerId are required");
    }

    // 1. Verify target employee exists
    const [employee] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!employee) {
      const error = new Error("Target employee user not found");
      error.status = 404;
      throw error;
    }

    // 2. Verify manager is currently assigned
    if (employee.reportingManagerId !== managerId) {
      throw new Error("The specified manager is not currently assigned to this employee");
    }

    // 3. Remove the manager assignment (set NULL)
    const [updatedEmployee] = await db
      .update(users)
      .set({ reportingManagerId: null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        reportingManagerId: users.reportingManagerId,
        updatedAt: users.updatedAt,
      });

    return updatedEmployee;
  }

  static async getDirectory(requesterId, requesterRole) {
    if (requesterRole === "EMP") {
      const error = new Error("Forbidden: Employees do not have permission to view the directory");
      error.status = 403;
      throw error;
    }

    let queryResults = [];

    if (requesterRole === "RM") {
      // Lists ALL the EMPs reporting directly to them
      queryResults = await db
        .select()
        .from(users)
        .where(and(eq(users.role, "EMP"), eq(users.reportingManagerId, requesterId)));
    } else if (requesterRole === "APE") {
      // Lists ALL EMPs and RMs in the system
      queryResults = await db
        .select()
        .from(users)
        .where(inArray(users.role, ["EMP", "RM"]));
    } else if (requesterRole === "CFO") {
      // Lists absolutely everyone
      queryResults = await db.select().from(users);
    }

    return queryResults.map(user => {
      const name = user.email.split("@")[0]; // default representation as name is not stored
      return {
        userId: user.id,
        name: name,
        email: user.email,
        role: user.role,
      };
    });
  }
}
