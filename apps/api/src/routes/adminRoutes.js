import { Router } from "express";
import {
  audit,
  controls,
  disputeQueue,
  metrics,
  moderateJob,
  moderationQueue,
  resolveDispute,
  updateControl,
  updateUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:flagId/decision", moderateJob);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", resolveDispute);
adminRoutes.get("/platform-controls", controls);
adminRoutes.patch("/platform-controls/:control", updateControl);
adminRoutes.get("/audit-log", audit);
