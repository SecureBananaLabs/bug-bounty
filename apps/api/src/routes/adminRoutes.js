import { Router } from "express";
import {
  auditLog,
  disputeAction,
  disputes,
  flaggedJobs,
  jobModerationAction,
  metrics,
  platformSettings,
  updatePlatformSettings,
  userAction,
  userDetail,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.post("/users/:id/actions", userAction);
adminRoutes.get("/flagged-jobs", flaggedJobs);
adminRoutes.post("/flagged-jobs/:id/actions", jobModerationAction);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:id/actions", disputeAction);
adminRoutes.get("/settings", platformSettings);
adminRoutes.post("/settings", updatePlatformSettings);
adminRoutes.get("/audit-log", auditLog);
