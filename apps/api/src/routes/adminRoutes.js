import { Router } from "express";
import {
  auditLog,
  controls,
  disputeAction,
  disputes,
  metrics,
  moderation,
  moderationAction,
  updateControls,
  userAction,
  userProfile,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", handle(metrics));
adminRoutes.get("/users", handle(users));
adminRoutes.get("/users/:id", handle(userProfile));
adminRoutes.patch("/users/:id/status", handle(userAction));
adminRoutes.get("/moderation", handle(moderation));
adminRoutes.post("/moderation/:id/action", handle(moderationAction));
adminRoutes.get("/disputes", handle(disputes));
adminRoutes.post("/disputes/:id/action", handle(disputeAction));
adminRoutes.get("/controls", handle(controls));
adminRoutes.patch("/controls", handle(updateControls));
adminRoutes.get("/audit-log", handle(auditLog));
