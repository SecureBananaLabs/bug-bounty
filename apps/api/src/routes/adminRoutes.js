import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";
import {
  metrics,
  listUsers,
  userDetail,
  suspendUserHandler,
  reinstateUserHandler,
  banUserHandler,
  listFlaggedJobs,
  approveJobHandler,
  rejectJobHandler,
  escalateJobHandler,
  listDisputes,
  disputeDetail,
  ruleDisputeHandler,
  listPlatformControls,
  updatePlatformControlHandler,
  listAuditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth
adminRoutes.use(authMiddleware);
adminRoutes.use(adminAuthMiddleware);

// Dashboard
adminRoutes.get("/metrics", metrics);

// User management
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:userId", userDetail);
adminRoutes.patch("/users/:userId/suspend", suspendUserHandler);
adminRoutes.patch("/users/:userId/reinstate", reinstateUserHandler);
adminRoutes.patch("/users/:userId/ban", banUserHandler);

// Content moderation
adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.post("/jobs/:jobId/approve", approveJobHandler);
adminRoutes.post("/jobs/:jobId/reject", rejectJobHandler);
adminRoutes.post("/jobs/:jobId/escalate", escalateJobHandler);

// Dispute handling
adminRoutes.get("/disputes", listDisputes);
adminRoutes.get("/disputes/:disputeId", disputeDetail);
adminRoutes.patch("/disputes/:disputeId/rule", ruleDisputeHandler);

// Platform controls
adminRoutes.get("/platform-controls", listPlatformControls);
adminRoutes.patch("/platform-controls/:key", updatePlatformControlHandler);

// Audit log
adminRoutes.get("/audit-log", listAuditLog);
