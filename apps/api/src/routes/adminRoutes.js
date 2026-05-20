import { Router } from "express";
import {
  auditLog,
  disputeAction,
  disputes,
  jobAction,
  jobs,
  metrics,
  settings,
  userAction,
  users
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/admin.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId", userAction);
adminRoutes.get("/jobs", jobs);
adminRoutes.patch("/jobs/:jobId", jobAction);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId", disputeAction);
adminRoutes.get("/settings", settings);
adminRoutes.patch("/settings", settings);
adminRoutes.get("/audit-log", auditLog);
