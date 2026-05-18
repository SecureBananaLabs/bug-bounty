import { Router } from "express";
import {
  metrics,
  getAdminUsers,
  getAdminUserById,
  patchUserStatus,
  getFlaggedJobs,
  postModerateJob,
  getDisputes,
  getDisputeByIdHandler,
  postRuleDispute,
  getPlatformControls,
  patchPlatformControls,
  getAuditLogHandler
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminAuth } from "../middleware/adminAuth.js";

export const adminRoutes = Router();

// All admin routes require authentication + admin role
adminRoutes.use(authMiddleware, adminAuth);

// ── Dashboard & Metrics ─────────────────────────────────────────────────────
adminRoutes.get("/metrics", metrics);

// ── User Management ─────────────────────────────────────────────────────────
adminRoutes.get("/users", getAdminUsers);
adminRoutes.get("/users/:id", getAdminUserById);
adminRoutes.patch("/users/:id/status", patchUserStatus);

// ── Job / Listing Moderation ────────────────────────────────────────────────
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", postModerateJob);

// ── Dispute Resolution ──────────────────────────────────────────────────────
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDisputeByIdHandler);
adminRoutes.post("/disputes/:id/rule", postRuleDispute);

// ── Platform Controls ───────────────────────────────────────────────────────
adminRoutes.get("/controls", getPlatformControls);
adminRoutes.patch("/controls", patchPlatformControls);

// ── Audit Log ───────────────────────────────────────────────────────────────
adminRoutes.get("/audit-log", getAuditLogHandler);
