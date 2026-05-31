import { Router } from "express";
import {
  auditLogs,
  changeUserStatus,
  disputeDetail,
  disputeRuling,
  disputes,
  metrics,
  moderateJob,
  moderationQueue,
  platformControls,
  platformControlUpdate,
  userDetail,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.patch("/users/:id/status", changeUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.patch("/moderation/jobs/:id", moderateJob);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.patch("/disputes/:id/ruling", disputeRuling);
adminRoutes.get("/platform-controls", platformControls);
adminRoutes.patch("/platform-controls/:key", platformControlUpdate);
adminRoutes.get("/audit-logs", auditLogs);
