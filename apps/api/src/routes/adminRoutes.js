import { Router } from "express";
import {
  metrics,
  listUsers,
  handleUserDetail,
  handleSuspendUser,
  handleReinstateUser,
  handleBanUser,
  listFlaggedJobs,
  handleApproveJob,
  handleRejectJob,
  handleEscalateJob,
  listDisputes,
  handleDisputeDetail,
  handleRuleDispute,
  getControls,
  updateControl,
  getAuditLogs,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

adminRoutes.get("/metrics", metrics);

adminRoutes.use(adminAuthMiddleware);

adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", handleUserDetail);
adminRoutes.patch("/users/:id/suspend", handleSuspendUser);
adminRoutes.patch("/users/:id/reinstate", handleReinstateUser);
adminRoutes.delete("/users/:id/ban", handleBanUser);

adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.patch("/jobs/:id/approve", handleApproveJob);
adminRoutes.patch("/jobs/:id/reject", handleRejectJob);
adminRoutes.patch("/jobs/:id/escalate", handleEscalateJob);

adminRoutes.get("/disputes", listDisputes);
adminRoutes.get("/disputes/:id", handleDisputeDetail);
adminRoutes.post("/disputes/:id/rule", handleRuleDispute);

adminRoutes.get("/controls", getControls);
adminRoutes.patch("/controls", updateControl);

adminRoutes.get("/audit-log", getAuditLogs);
