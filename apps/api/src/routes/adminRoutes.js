import { Router } from "express";
import {
  controls,
  dashboard,
  disputeRuling,
  disputes,
  flaggedJobs,
  metrics,
  moderateJob,
  moderateUser,
  notifications,
  updateControl,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/dashboard", dashboard);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", moderateUser);
adminRoutes.get("/moderation/jobs", flaggedJobs);
adminRoutes.patch("/moderation/jobs/:jobId", moderateJob);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", updateControl);
adminRoutes.get("/notifications", notifications);
