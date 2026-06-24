import { pgTable, uuid, varchar, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["EMP", "RM", "APE", "CFO"]);
export const reimbursementStatusEnum = pgEnum("reimbursement_status", ["PENDING", "APPROVED", "REJECTED"]);
export const approvalStatusEnum = pgEnum("approval_status", ["APPROVED", "REJECTED"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("EMP"),
  reportingManagerId: uuid("reporting_manager_id").references(() => users.id, { onDelete: "SET NULL" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reimbursements = pgTable("reimbursements", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => users.id, { onDelete: "CASCADE" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: reimbursementStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reimbursementApprovals = pgTable("reimbursement_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  reimbursementId: uuid("reimbursement_id").references(() => reimbursements.id, { onDelete: "CASCADE" }).notNull(),
  approverId: uuid("approver_id").references(() => users.id, { onDelete: "CASCADE" }).notNull(),
  role: roleEnum("role").notNull(),
  status: approvalStatusEnum("status").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
