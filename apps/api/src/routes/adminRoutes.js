import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetails,
  disputeRuling,
  disputes,
  metrics,
  moderationAction,
  moderationJobs,
  updateControls,
  userProfile,
  userStatus,
  users
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/admin.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", userStatus);
adminRoutes.get("/jobs/moderation", moderationJobs);
adminRoutes.patch("/jobs/moderation/:jobId", moderationAction);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", disputeDetails);
adminRoutes.patch("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", updateControls);
adminRoutes.get("/audit-log", auditLog);
