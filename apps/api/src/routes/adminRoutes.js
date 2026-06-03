import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  getMetrics, getUsers, getUserDetail,
  suspendUser, reinstateUser, banUser,
  getModerationQueue, approveJob, rejectJob,
  getDisputes, getDisputeDetail, resolveDispute,
  getPlatformSettings, updatePlatformSettings
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All routes require auth + admin role
adminRoutes.use(authMiddleware, adminMiddleware);

// Dashboard
adminRoutes.get("/metrics", getMetrics);

// User management
adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:id", getUserDetail);
adminRoutes.put("/users/:id/suspend", suspendUser);
adminRoutes.put("/users/:id/reinstate", reinstateUser);
adminRoutes.put("/users/:id/ban", banUser);

// Moderation
adminRoutes.get("/moderation", getModerationQueue);
adminRoutes.put("/moderation/:flaggedId/approve", approveJob);
adminRoutes.put("/moderation/:flaggedId/reject", rejectJob);

// Disputes
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDisputeDetail);
adminRoutes.put("/disputes/:id/resolve", resolveDispute);

// Platform settings
adminRoutes.get("/settings", getPlatformSettings);
adminRoutes.put("/settings", updatePlatformSettings);
