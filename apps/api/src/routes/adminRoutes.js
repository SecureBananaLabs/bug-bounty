import { Router } from "express";
import {
  auditLog,
  controlUpdate,
  controls,
  disputeRuling,
  disputes,
  metrics,
  moderation,
  moderationDecision,
  overview,
  userStatusUpdate,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", userStatusUpdate);
adminRoutes.get("/moderation", moderation);
adminRoutes.patch("/moderation/:jobId/decision", moderationDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:controlKey", controlUpdate);
adminRoutes.get("/audit-log", auditLog);
