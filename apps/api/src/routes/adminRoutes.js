import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";
import {
  getMetrics, listUsers, getUser,
  handleSuspendUser, handleReinstateUser, handleBanUser, handleDeleteUser,
  listFlaggedJobs, handleApproveJob, handleRejectJob, handleEscalateJob,
  listDisputes, getDispute, handleRuleDispute,
  getControls, updateControl, getAudit,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All routes need auth
adminRoutes.use(authMiddleware);

// Metrics (read-only, just needs auth)
adminRoutes.get("/metrics", getMetrics);

// Everything below needs admin role
adminRoutes.get("/users", adminAuthMiddleware, listUsers);
adminRoutes.get("/users/:id", adminAuthMiddleware, getUser);
adminRoutes.patch("/users/:id/suspend", adminAuthMiddleware, handleSuspendUser);
adminRoutes.patch("/users/:id/reinstate", adminAuthMiddleware, handleReinstateUser);
adminRoutes.delete("/users/:id/ban", adminAuthMiddleware, handleBanUser);
adminRoutes.delete("/users/:id", adminAuthMiddleware, handleDeleteUser);
adminRoutes.get("/jobs/flagged", adminAuthMiddleware, listFlaggedJobs);
adminRoutes.patch("/jobs/:id/approve", adminAuthMiddleware, handleApproveJob);
adminRoutes.patch("/jobs/:id/reject", adminAuthMiddleware, handleRejectJob);
adminRoutes.patch("/jobs/:id/escalate", adminAuthMiddleware, handleEscalateJob);
adminRoutes.get("/disputes", adminAuthMiddleware, listDisputes);
adminRoutes.get("/disputes/:id", adminAuthMiddleware, getDispute);
adminRoutes.post("/disputes/:id/rule", adminAuthMiddleware, handleRuleDispute);
adminRoutes.get("/controls", adminAuthMiddleware, getControls);
adminRoutes.patch("/controls", adminAuthMiddleware, updateControl);
adminRoutes.get("/audit-log", adminAuthMiddleware, getAudit);
