import { Router } from "express";
import {
  auditLog,
  controls,
  disputes,
  metrics,
  moderateListing,
  moderationQueue,
  overview,
  ruleDispute,
  setControl,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/overview", overview);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id/status", setUserStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.patch("/moderation/:id", moderateListing);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", setControl);
adminRoutes.get("/audit-log", auditLog);
