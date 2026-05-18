import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  metrics, getUsers, patchUser,
  getFlaggedJobs, patchJob,
  getDisputes, patchDispute,
  getAuditLog, getControls, patchControl,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require authentication — admin role verified per-controller
adminRoutes.use(authMiddleware);

adminRoutes.get("/metrics",          metrics);
adminRoutes.get("/users",            getUsers);
adminRoutes.patch("/users/:id",      patchUser);
adminRoutes.get("/jobs/flagged",     getFlaggedJobs);
adminRoutes.patch("/jobs/:id",       patchJob);
adminRoutes.get("/disputes",         getDisputes);
adminRoutes.patch("/disputes/:id",   patchDispute);
adminRoutes.get("/audit-log",        getAuditLog);
adminRoutes.get("/controls",         getControls);
adminRoutes.patch("/controls/:key",  patchControl);
