import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputes,
  flaggedJobs,
  metrics,
  moderateJob,
  ruleDispute,
  toggleControl,
  updateUserStatus,
  userDetail,
  users
} from "../controllers/adminController.js";
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnlyMiddleware);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.post("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", flaggedJobs);
adminRoutes.post("/moderation/jobs/:id/action", moderateJob);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.post("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.post("/controls/:key", toggleControl);
adminRoutes.get("/audit-log", auditLog);
