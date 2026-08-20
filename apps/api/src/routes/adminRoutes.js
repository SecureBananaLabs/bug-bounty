import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import {
  metrics,
  getUsers,
  getUserById,
  suspendUser,
  reinstateUser,
  banUser,
  getFlaggedJobs,
  moderateJobAction,
  getDisputes,
  getDisputeById,
  resolveDisputeAction,
  getSettings,
  updateSetting,
  getAudit,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware, adminMiddleware);

// Metrics
adminRoutes.get("/metrics", metrics);

// User Management
adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:id", getUserById);
adminRoutes.post("/users/:id/suspend", suspendUser);
adminRoutes.post("/users/:id/reinstate", reinstateUser);
adminRoutes.post("/users/:id/ban", banUser);

// Job Moderation
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", moderateJobAction);

// Dispute Resolution
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDisputeById);
adminRoutes.post("/disputes/:id/resolve", resolveDisputeAction);

// Platform Controls
adminRoutes.get("/settings", getSettings);
adminRoutes.post("/settings", updateSetting);

// Audit Log
adminRoutes.get("/audit-log", getAudit);
