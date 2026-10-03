import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputeRuling,
  disputes,
  moderationQueue,
  overview,
  updateControl,
  updateModerationStatus,
  updateUserStatus,
  userProfile,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnly);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", overview);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.patch("/moderation/:jobId", updateModerationStatus);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", disputeDetail);
adminRoutes.patch("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", updateControl);
adminRoutes.get("/audit", auditLog);
