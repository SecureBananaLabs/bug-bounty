import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  metrics,
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getAllJobs,
  flagJob,
  getAuditLogs,
  createDispute,
  getDisputes,
  resolveDispute,
  getDisputeById,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All routes require admin auth
adminRoutes.use(adminAuth);

// Metrics
adminRoutes.get("/metrics", metrics);

// Users
adminRoutes.get("/users", getAllUsers);
adminRoutes.get("/users/:id", getUserById);
adminRoutes.patch("/users/:id/suspend", suspendUser);
adminRoutes.patch("/users/:id/activate", activateUser);

// Jobs
adminRoutes.get("/jobs", getAllJobs);
adminRoutes.patch("/jobs/:id/flag", flagJob);

// Audit Logs
adminRoutes.get("/audit-logs", getAuditLogs);

// Disputes
adminRoutes.post("/disputes", createDispute);
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDisputeById);
adminRoutes.patch("/disputes/:id/resolve", resolveDispute);
