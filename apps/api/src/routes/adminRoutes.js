import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputeRuling,
  disputes,
  metrics,
  moderation,
  moderationDecision,
  platformControl,
  userDetail,
  userStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.post("/users/:id/status", userStatus);
adminRoutes.get("/moderation", moderation);
adminRoutes.post("/moderation/:id/decision", moderationDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.post("/disputes/:id/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.post("/controls/:key", platformControl);
adminRoutes.get("/audit", auditLog);
