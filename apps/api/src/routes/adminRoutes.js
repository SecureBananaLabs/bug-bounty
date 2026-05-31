import { Router } from "express";
import {
  auditLog,
  disputes,
  metrics,
  moderationQueue,
  platformControls,
  updateControl,
  updateDispute,
  updateModerationStatus,
  updateUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.patch("/moderation/jobs/:jobId", updateModerationStatus);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId", updateDispute);
adminRoutes.get("/platform-controls", platformControls);
adminRoutes.patch("/platform-controls/:controlKey", updateControl);
adminRoutes.get("/audit-log", auditLog);
