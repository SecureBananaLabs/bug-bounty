import { Router } from "express";
import { adminMiddleware } from "../middleware/adminAuth.js";
import {
  getMetrics,
  listUsers, getUserDetail, updateUserStatus,
  listFlaggedJobs, moderateJob,
  listDisputes, getDispute, resolveDispute,
  getPlatformSettings, updatePlatformSetting,
  getAuditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", getMetrics);

adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", getUserDetail);
adminRoutes.patch("/users/:id/status", updateUserStatus);

adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", moderateJob);

adminRoutes.get("/disputes", listDisputes);
adminRoutes.get("/disputes/:id", getDispute);
adminRoutes.post("/disputes/:id/resolve", resolveDispute);

adminRoutes.get("/settings", getPlatformSettings);
adminRoutes.patch("/settings", updatePlatformSetting);

adminRoutes.get("/audit-log", getAuditLog);
