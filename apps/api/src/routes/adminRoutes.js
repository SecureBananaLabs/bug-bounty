import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminAuth.js";
import {
  listUsers, getUser, updateUser,
  listFlaggedJobs, moderateJobAction,
  listDisputes, resolveDisputeAction,
  metrics, auditLog, settings, updateSettings,
} from "../controllers/adminController.js";

export const adminRoutes = Router();
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", getUser);
adminRoutes.patch("/users/:id/status", updateUser);
adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", moderateJobAction);
adminRoutes.get("/disputes", listDisputes);
adminRoutes.post("/disputes/:id/resolve", resolveDisputeAction);
adminRoutes.get("/audit-log", auditLog);
adminRoutes.get("/settings", settings);
adminRoutes.put("/settings", updateSettings);
