import { Router } from "express";
import {
  auditLog,
  changeControl,
  changeUserStatus,
  controls,
  disputeRuling,
  disputes,
  metrics,
  moderateListing,
  moderationQueue,
  notifications,
  userProfile,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnly);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", changeUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:jobId", moderateListing);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", changeControl);
adminRoutes.get("/audit-log", auditLog);
adminRoutes.get("/notifications", notifications);
