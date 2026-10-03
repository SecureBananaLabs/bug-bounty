import { Router } from "express";
import {
  audit,
  decideModerationJob,
  disputes,
  metrics,
  moderationJobs,
  platformControls,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus,
  users,
} from "../controllers/adminController.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationJobs);
adminRoutes.post("/moderation/jobs/:id/decision", decideModerationJob);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/platform-controls", platformControls);
adminRoutes.post("/platform-controls", updatePlatformControl);
adminRoutes.get("/audit", audit);
