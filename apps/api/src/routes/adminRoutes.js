import { Router } from "express";
import {
  auditLog,
  controls,
  disputeQueue,
  flaggedJobs,
  metrics,
  setControl,
  setDisputeRuling,
  setJobModeration,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/jobs/flagged", flaggedJobs);
adminRoutes.patch("/jobs/:jobId/moderation", setJobModeration);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.patch("/disputes/:disputeId/ruling", setDisputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", setControl);
adminRoutes.get("/audit-log", auditLog);
