import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminAuth.js";
import {
  listUsers, getUser, updateUser,
  listFlaggedJobs, moderateJobAction,
  listDisputes, resolveDisputeAction,
  metrics,
  auditLog,
  settings, updateSettings,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

// Dashboard
adminRoutes.get("/metrics", metrics);

// User Management
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", getUser);
adminRoutes.patch("/users/:id/status", updateUser);

// Job Moderation
adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", moderateJobAction);

// Dispute Resolution
adminRoutes.get("/disputes", listDisputes);
adminRoutes.post("/disputes/:id/resolve", resolveDisputeAction);

// Audit Log
adminRoutes.get("/audit-log", auditLog);

// Platform Settings
adminRoutes.get("/settings", settings);
adminRoutes.put("/settings", updateSettings);
