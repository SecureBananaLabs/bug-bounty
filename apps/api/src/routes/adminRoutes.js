import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../services/adminService.js";
import {
  metrics,
  getUsers,
  postUserStatus,
  getFlaggedJobs,
  postModerateJob,
  getDisputes,
  postResolveDispute,
  getControls,
  postUpdateControl,
  getLogs
} from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

// Trust & Metrics Dashboard
adminRoutes.get("/metrics", metrics);

// User Management
adminRoutes.get("/users", getUsers);
adminRoutes.post("/users/:userId/status", postUserStatus);

// Job & Listing Moderation
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:jobId/moderate", postModerateJob);

// Dispute Resolution
adminRoutes.get("/disputes", getDisputes);
adminRoutes.post("/disputes/:disputeId/resolve", postResolveDispute);

// Platform Controls
adminRoutes.get("/controls", getControls);
adminRoutes.post("/controls", postUpdateControl);

// Audit Logs
adminRoutes.get("/logs", getLogs);
