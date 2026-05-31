import { Router } from "express";
import {
  auditLogs,
  disputeDetails,
  disputeQueue,
  disputeRuling,
  metrics,
  moderationDecision,
  moderationJobs,
  platformControls,
  platformControlUpdate,
  userDetails,
  users,
  userStatus
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userDetails);
adminRoutes.patch("/users/:userId/status", userStatus);
adminRoutes.get("/moderation/jobs", moderationJobs);
adminRoutes.post("/moderation/jobs/:jobId/decision", moderationDecision);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.get("/disputes/:disputeId", disputeDetails);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", platformControls);
adminRoutes.patch("/controls/:controlName", platformControlUpdate);
adminRoutes.get("/audit-logs", auditLogs);
