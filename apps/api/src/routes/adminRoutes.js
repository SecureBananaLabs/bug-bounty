import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetails,
  disputes,
  health,
  metrics,
  moderationJobs,
  setControl,
  setDisputeRuling,
  setModerationDecision,
  setUserStatus,
  userDetails,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/health", health);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userID", userDetails);
adminRoutes.patch("/users/:userID/status", setUserStatus);
adminRoutes.get("/moderation/jobs", moderationJobs);
adminRoutes.patch("/moderation/jobs/:jobID", setModerationDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeID", disputeDetails);
adminRoutes.patch("/disputes/:disputeID/ruling", setDisputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", setControl);
adminRoutes.get("/audit-log", auditLog);
