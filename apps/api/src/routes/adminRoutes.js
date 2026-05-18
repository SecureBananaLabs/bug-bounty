import { Router } from "express";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";
import {
  metrics,
  getUsers,
  patchUserStatus,
  getFlaggedJobs,
  patchJobDecision,
  getDisputes,
  patchDisputeRuling,
  auditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require a valid JWT with role === "admin"
adminRoutes.use(adminAuthMiddleware);

adminRoutes.get("/metrics", metrics);

adminRoutes.get("/users", getUsers);
adminRoutes.patch("/users/:id/status", patchUserStatus);

adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.patch("/jobs/:id/decision", patchJobDecision);

adminRoutes.get("/disputes", getDisputes);
adminRoutes.patch("/disputes/:id/ruling", patchDisputeRuling);

adminRoutes.get("/audit", auditLog);
