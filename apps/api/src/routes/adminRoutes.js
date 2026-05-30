import { Router } from "express";
import { authMiddleware, adminOnly } from "../middleware/auth.js";
import * as adminController from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

// Dashboard
adminRoutes.get("/metrics", adminController.getMetrics);

// User management
adminRoutes.get("/users", adminController.listUsers);
adminRoutes.post("/users/:id/suspend", adminController.suspendUser);
adminRoutes.post("/users/:id/reinstate", adminController.reinstateUser);
adminRoutes.post("/users/:id/ban", adminController.banUser);

// Job moderation
adminRoutes.get("/jobs", adminController.listJobs);
adminRoutes.post("/jobs/:id/approve", adminController.approveJob);
adminRoutes.post("/jobs/:id/reject", adminController.rejectJob);
adminRoutes.post("/jobs/:id/escalate", adminController.escalateJob);

// Disputes
adminRoutes.get("/disputes", adminController.listDisputes);
adminRoutes.post("/disputes", adminController.createDispute);
adminRoutes.post("/disputes/:id/resolve", adminController.resolveDispute);
adminRoutes.post("/disputes/:id/escalate", adminController.escalateDispute);
adminRoutes.post("/disputes/:id/note", adminController.addDisputeNote);

// Audit log
adminRoutes.get("/audit-log", adminController.getAuditLog);

// Platform controls
adminRoutes.get("/settings", adminController.getSettings);
adminRoutes.post("/settings/toggle-registrations", adminController.toggleRegistrations);
adminRoutes.post("/settings/toggle-job-posting", adminController.toggleJobPosting);
