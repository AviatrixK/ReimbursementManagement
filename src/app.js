import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import roleRoutes from "./routes/role.routes.js";
import employeeRoutes from "./routes/employee.routes.js";

const app = express();

// ── Core Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));

// ── Health Check ─────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    data: {
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Routes ───────────────────────────────────────────────────────
app.use("/rest/onboardings", authRoutes);
app.use("/rest/roles", roleRoutes);
app.use("/rest/employees", employeeRoutes);

// ── 404 Handler ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error details:", err);
  const status = err.status || 400;
  return res.status(status).json({
    success: false,
    message: err.message || "An unexpected error occurred",
  });
});

export default app;
