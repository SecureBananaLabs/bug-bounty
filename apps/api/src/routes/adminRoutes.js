import { Router } from "express";
import {
  auditLog,
  controls,
  disputes,
  flaggedJobs,
  metrics,
  moderateFlaggedJob,
  ruleOnDispute,
  updateControl,
  updateUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/flagged-jobs", flaggedJobs);
adminRoutes.patch("/flagged-jobs/:jobId/moderate", moderateFlaggedJob);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId/rule", ruleOnDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:controlKey", updateControl);
adminRoutes.get("/audit-log", auditLog);
