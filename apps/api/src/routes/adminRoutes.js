import { Router } from "express";
import * as ctrl from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminMiddleware);

// Dashboard
adminRoutes.get("/metrics", ctrl.metrics);

// User management
adminRoutes.get("/users", ctrl.listUsers);
adminRoutes.patch("/users/:id/suspend", ctrl.suspendUser);
adminRoutes.patch("/users/:id/resume", ctrl.resumeUser);
adminRoutes.patch("/users/:id/ban", ctrl.banUser);

// Job moderation
adminRoutes.get("/jobs/moderation", ctrl.listFlaggedJobs);
adminRoutes.post("/jobs/:id/approve", ctrl.approveJob);
adminRoutes.post("/jobs/:id/reject", ctrl.rejectJob);
adminRoutes.post("/jobs/:id/escalate", ctrl.escalateJob);

// Disputes
adminRoutes.get("/disputes", ctrl.listDisputes);
adminRoutes.get("/disputes/:id", ctrl.getDispute);
adminRoutes.post("/disputes/:id/resolve", ctrl.resolveDispute);

// Platform settings
adminRoutes.get("/settings", ctrl.getSettings);
adminRoutes.put("/settings", ctrl.updateSettings);

// Audit log
adminRoutes.get("/audit-log", ctrl.listAuditLogs);
