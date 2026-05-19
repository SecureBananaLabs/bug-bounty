import { Router } from "express";
import {
  auditLog,
  controlUpdate,
  controls,
  disputeRuling,
  disputes,
  metrics,
  moderationAction,
  moderationJobs,
  userProfile,
  users,
  userStatus
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", userStatus);
adminRoutes.get("/moderation/jobs", moderationJobs);
adminRoutes.post("/moderation/jobs/:jobId/action", moderationAction);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:controlName", controlUpdate);
adminRoutes.get("/audit-log", auditLog);
