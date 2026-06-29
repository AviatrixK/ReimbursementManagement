import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export class RoleService {
  static async assignRole({ userId, role }) {
    if (!userId || !role) {
      throw new Error("userId and role are required");
    }

    const validRoles = ["EMP", "RM", "APE", "CFO"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    // Check if target user exists
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) {
      const error = new Error("Target user not found");
      error.status = 404;
      throw error;
    }

    // Update the role
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }
}
