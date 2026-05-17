import { Router } from "express";
import {
  auditLog,
  controls,
  disputeRuling,
  disputes,
  listingDecision,
  metrics,
  moderationQueue,
  overview,
  updateControl,
  updateUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnlyMiddleware);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.post("/moderation/:id/decision", listingDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:id/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", updateControl);
adminRoutes.get("/audit-log", auditLog);
