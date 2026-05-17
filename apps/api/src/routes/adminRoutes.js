import { Router } from "express";
import {
  audit,
  controlUpdate,
  controls,
  disputeDetails,
  disputeRuling,
  disputes,
  metrics,
  moderation,
  moderationDecision,
  userProfile,
  userStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/overview", metrics);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", userStatus);
adminRoutes.get("/moderation", moderation);
adminRoutes.post("/moderation/:itemId/decision", moderationDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", disputeDetails);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:controlKey", controlUpdate);
adminRoutes.get("/audit", audit);
