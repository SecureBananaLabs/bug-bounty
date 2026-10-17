import { Router } from "express";
import {
  metrics,
  listUsers,
  changeUserStatus,
  listFlaggedJobs,
  moderateJobAction,
  listDisputes,
  resolveDisputeAction,
  getControls,
  toggleControl,
  listAuditLogs
} from "../controllers/adminController.js";
import { authMiddleware, requireAdminRole } from "../middleware/auth.js";

export const adminRoutes = Router();

// Strictly guard all admin endpoints: requires valid JWT AND admin role
adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdminRole);

// Metrics & Trust
adminRoutes.get("/metrics", metrics);

// User Management
adminRoutes.get("/users", listUsers);
adminRoutes.patch("/users/:id/status", changeUserStatus);

// Job Moderation
adminRoutes.get("/moderation/jobs", listFlaggedJobs);
adminRoutes.post("/moderation/jobs/:id/action", moderateJobAction);

// Dispute Resolution
adminRoutes.get("/disputes", listDisputes);
adminRoutes.post("/disputes/:id/action", resolveDisputeAction);

// Platform Controls
adminRoutes.get("/controls", getControls);
adminRoutes.post("/controls/toggle", toggleControl);

// Audit Logs
adminRoutes.get("/audit-logs", listAuditLogs);
