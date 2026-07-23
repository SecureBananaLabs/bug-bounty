import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);

// Dashboard metrics
adminRoutes.get("/metrics", adminController.metrics);

// Users
adminRoutes.get("/users", adminController.getUsers);
adminRoutes.get("/users/:id", adminController.getUser);
adminRoutes.put("/users/:id/status", adminController.updateUserStatus);

// Moderation
adminRoutes.get("/moderation/jobs", adminController.getFlaggedJobs);
adminRoutes.put("/moderation/jobs/:id", adminController.moderateJob);

// Disputes
adminRoutes.get("/disputes", adminController.getDisputes);
adminRoutes.get("/disputes/:id", adminController.getDispute);
adminRoutes.put("/disputes/:id/resolve", adminController.resolveDispute);

// Settings
adminRoutes.get("/settings", adminController.getPlatformSettings);
adminRoutes.put("/settings", adminController.updatePlatformSettings);

// Audit logs
adminRoutes.get("/audit-logs", adminController.getAuditLogs);
