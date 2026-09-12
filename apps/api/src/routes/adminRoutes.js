import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import {
  metrics,
  trustScores,
  getUsers,
  getUser,
  setUserStatus,
  getFlaggedJobs,
  moderateJobHandler,
  getDisputes,
  getDispute,
  resolveDisputeHandler,
  getConfig,
  setConfig,
  getAuditLogs,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

// Metrics & Dashboard
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/trust-scores", trustScores);

// User Management
adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:id", getUser);
adminRoutes.patch("/users/:id/status", setUserStatus);

// Job Moderation
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", moderateJobHandler);

// Dispute Resolution
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDispute);
adminRoutes.post("/disputes/:id/resolve", resolveDisputeHandler);

// Platform Controls
adminRoutes.get("/config", getConfig);
adminRoutes.patch("/config", setConfig);

// Audit Log
adminRoutes.get("/audit-logs", getAuditLogs);
