import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";
import {
  listUsers, updateUser, viewUser,
  listFlaggedJobs, moderateFlaggedJob,
  listDisputes, resolveDisputeAction,
  metrics,
  toggleRegistration, togglePostings,
  auditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware);
adminRoutes.use(adminAuthMiddleware);

// Dashboard
adminRoutes.get("/metrics", metrics);

// User management
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:userId", viewUser);
adminRoutes.patch("/users/:userId/status", updateUser);

// Job moderation
adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.post("/jobs/:jobId/moderate", moderateFlaggedJob);

// Disputes
adminRoutes.get("/disputes", listDisputes);
adminRoutes.post("/disputes/:disputeId/resolve", resolveDisputeAction);

// Platform controls
adminRoutes.post("/controls/registrations", toggleRegistration);
adminRoutes.post("/controls/postings", togglePostings);

// Audit log
adminRoutes.get("/audit-log", auditLog);
