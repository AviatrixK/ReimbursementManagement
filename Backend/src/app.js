import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import roleRoutes from "./routes/role.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import reimbursementRoutes from "./routes/reimbursement.routes.js";

const app = express();

// ── CORS ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3001",
    "null",  // file:// origin
  ];
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Core Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));

// ── Health Check ─────────────────────────────────────────────────
app.get(["/health", "/rest/health"], (_req, res) => {
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
app.use("/rest/reimbursements", reimbursementRoutes);

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
