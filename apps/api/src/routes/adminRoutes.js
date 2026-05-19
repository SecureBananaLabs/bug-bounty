import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import {
  metrics,
  listUsers,
  getUserDetail,
  setUserStatus,
  listFlaggedJobs,
  moderateJobHandler,
  listDisputes,
  getDispute,
  createDisputeHandler,
  ruleOnDisputeHandler,
  getControls,
  updateControl,
  listAuditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

// Dashboard metrics
adminRoutes.get("/metrics", metrics);

// User management
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", getUserDetail);
adminRoutes.patch("/users/:id/status", setUserStatus);

// Job moderation
adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.patch("/jobs/:id/moderate", moderateJobHandler);

// Dispute resolution
adminRoutes.get("/disputes", listDisputes);
adminRoutes.get("/disputes/:id", getDispute);
adminRoutes.post("/disputes", createDisputeHandler);
adminRoutes.patch("/disputes/:id/rule", ruleOnDisputeHandler);

// Platform controls
adminRoutes.get("/controls", getControls);
adminRoutes.patch("/controls", updateControl);

// Audit log
adminRoutes.get("/audit-log", listAuditLog);
