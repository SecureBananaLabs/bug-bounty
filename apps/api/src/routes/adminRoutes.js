import { Router } from "express";
import {
  metrics,
  trustScores,
  listUsers,
  getUserDetail,
  updateUserStatus,
  getFlaggedJobs,
  moderateJob,
  listDisputes,
  resolveDispute,
  getConfig,
  updateConfig,
  getAuditLogs
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);

// Dashboard
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/trust-scores", trustScores);

// Users
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", getUserDetail);
adminRoutes.patch("/users/:id/status", updateUserStatus);

// Jobs moderation
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", moderateJob);

// Disputes
adminRoutes.get("/disputes", listDisputes);
adminRoutes.post("/disputes/:id/resolve", resolveDispute);

// Platform config
adminRoutes.get("/config", getConfig);
adminRoutes.patch("/config", updateConfig);

// Audit logs
adminRoutes.get("/audit-logs", getAuditLogs);
