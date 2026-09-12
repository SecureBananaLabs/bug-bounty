import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputeRuling,
  disputes,
  metrics,
  moderationDecision,
  moderationQueue,
  setControls,
  userProfile,
  users,
  userStatus
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.post("/users/:userId/status", userStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.post("/moderation/:listingId/decision", moderationDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", disputeDetail);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.post("/controls", setControls);
adminRoutes.get("/audit-log", auditLog);
