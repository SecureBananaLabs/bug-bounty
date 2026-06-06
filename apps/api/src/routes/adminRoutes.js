import { Router } from "express";
import {
  auditLog,
  disputeQueue,
  metrics,
  moderateListing,
  moderationQueue,
  platformControl,
  resolveDispute,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminMiddleware);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:jobId", moderateListing);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", resolveDispute);
adminRoutes.patch("/controls/:key", platformControl);
adminRoutes.get("/audit-log", auditLog);
