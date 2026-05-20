import { Router } from "express";
import {
  auditLog,
  disputeDetails,
  disputes,
  flaggedJobs,
  metrics,
  platformControls,
  setControl,
  setDisputeRuling,
  setJobDecision,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnlyMiddleware);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation/jobs", flaggedJobs);
adminRoutes.post("/moderation/jobs/:jobId/decision", setJobDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", disputeDetails);
adminRoutes.post("/disputes/:disputeId/ruling", setDisputeRuling);
adminRoutes.get("/controls", platformControls);
adminRoutes.patch("/controls/:controlKey", setControl);
adminRoutes.get("/audit-log", auditLog);
