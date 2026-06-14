import { Router } from "express";
import {
  auditLog,
  controls,
  disputeQueue,
  disputeRuling,
  metrics,
  moderationDecision,
  moderationQueue,
  overview,
  updateControl,
  updateUserStatus,
  userProfile,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:listingId/decision", moderationDecision);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:control", updateControl);
adminRoutes.get("/audit-log", auditLog);
