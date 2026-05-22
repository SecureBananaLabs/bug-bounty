import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

// Protect all admin routes
adminRoutes.use(authMiddleware, requireAdmin);

adminRoutes.get("/metrics", adminController.metrics);

// Users
adminRoutes.get("/users", adminController.getUsers);
adminRoutes.patch("/users/:id/status", adminController.updateUserStatus);

// Moderation
adminRoutes.get("/jobs/flagged", adminController.getFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", adminController.moderateJob);

// Disputes
adminRoutes.get("/disputes", adminController.getDisputes);
adminRoutes.post("/disputes/:id/rule", adminController.ruleDispute);

// Settings
adminRoutes.get("/settings", adminController.getSettings);
adminRoutes.patch("/settings", adminController.updateSettings);

// Audit Logs
adminRoutes.get("/audit-logs", adminController.getAuditLogs);

