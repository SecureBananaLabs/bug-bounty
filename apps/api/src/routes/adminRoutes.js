import { Router } from "express";
import {
  metrics,
  getUsers, getUserById, suspendUser, resumeUser, banUser,
  getFlaggedJobs, approveJob, rejectJob,
  getDisputes, getDisputeById, resolveDispute,
  getPlatformSettings, toggleRegistrations, toggleJobPosting,
  getAuditLogs,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

// All admin routes require authentication
adminRoutes.use(authMiddleware);

// ── Metrics ──
adminRoutes.get("/metrics", metrics);

// ── User Management ──
adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:id", getUserById);
adminRoutes.post("/users/:id/suspend", suspendUser);
adminRoutes.post("/users/:id/resume", resumeUser);
adminRoutes.post("/users/:id/ban", banUser);

// ── Job Moderation ──
adminRoutes.get("/jobs/queue", getFlaggedJobs);
adminRoutes.post("/jobs/:id/approve", approveJob);
adminRoutes.post("/jobs/:id/reject", rejectJob);

// ── Dispute Resolution ──
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDisputeById);
adminRoutes.post("/disputes/:id/resolve", resolveDispute);

// ── Platform Controls ──
adminRoutes.get("/settings", getPlatformSettings);
adminRoutes.post("/settings/registrations", toggleRegistrations);
adminRoutes.post("/settings/job-posting", toggleJobPosting);

// ── Audit Log ──
adminRoutes.get("/audit-log", getAuditLogs);
