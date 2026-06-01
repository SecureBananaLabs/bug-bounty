import { Router } from "express";
import {
  auditLog,
  controls,
  dispute,
  disputes,
  metrics,
  moderateListing,
  moderationQueue,
  updateControls,
  updateDispute,
  updateUser,
  user,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", user);
adminRoutes.patch("/users/:id", updateUser);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:id/decision", moderateListing);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", dispute);
adminRoutes.post("/disputes/:id/ruling", updateDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", updateControls);
adminRoutes.get("/audit-log", auditLog);
