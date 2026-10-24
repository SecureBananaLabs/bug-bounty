import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getUsers,
  getUserProfile,
  updateUserStatus,
  getFlaggedJobs,
  getModerationJob,
  moderateJob,
  getDisputes,
  getDispute,
  resolveDispute,
  getControls,
  updateControls,
  getAudit,
  metrics,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// Server-side admin guard applied to ALL routes below.
adminRoutes.use(adminAuth);

// Metrics dashboard
adminRoutes.get("/metrics", metrics);

// User Management
adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:userId/profile", getUserProfile);
adminRoutes.patch("/users/:userId/:action", updateUserStatus);

// Job & Listing Moderation
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.get("/jobs/:jobId", getModerationJob);
adminRoutes.patch("/jobs/:jobId/:decision", moderateJob);

// Dispute Resolution
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:disputeId", getDispute);
adminRoutes.patch("/disputes/:disputeId/resolve/:ruling", resolveDispute);

// Platform Controls
adminRoutes.get("/controls", getControls);
adminRoutes.patch("/controls", updateControls);

// Audit Log
adminRoutes.get("/audit", getAudit);
