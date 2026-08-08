import { Router } from "express";
import {
  auditLog,
  disputes,
  disputeDetail,
  metrics,
  moderationQueue,
  platformControls,
  ruleDispute,
  updateModerationItem,
  updatePlatformControls,
  updateUserStatus,
  userDetail,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.post("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:id", updateModerationItem);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.post("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/platform-controls", platformControls);
adminRoutes.post("/platform-controls", updatePlatformControls);
adminRoutes.get("/audit-log", auditLog);
