import { Router } from "express";
import {
  auditLog,
  controls,
  disputes,
  metrics,
  moderation,
  ruleDispute,
  updateControls,
  updateModeration,
  updateUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation", moderation);
adminRoutes.post("/moderation/:id/decision", updateModeration);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", updateControls);
adminRoutes.get("/audit", auditLog);
