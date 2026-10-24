import { Router } from "express";
import {
  metrics,
  getUsers,
  getUser,
  suspend,
  reinstate,
  ban,
  getFlaggedJobs,
  approve,
  reject,
  escalate,
  getDisputes,
  getDispute,
  resolve,
  escalateDispute,
  getControls,
  toggleControl,
  getAuditLog,
} from "../controllers/adminController.js";
import { adminMiddleware } from "../middleware/adminAuth.js";

export const adminRoutes = Router();

// All admin routes require admin authentication
adminRoutes.use(adminMiddleware);

// Metrics dashboard
adminRoutes.get("/metrics", metrics);

// User management
adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:id", getUser);
adminRoutes.post("/users/:id/suspend", suspend);
adminRoutes.post("/users/:id/reinstate", reinstate);
adminRoutes.post("/users/:id/ban", ban);

// Job & listing moderation
adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:id/approve", approve);
adminRoutes.post("/jobs/:id/reject", reject);
adminRoutes.post("/jobs/:id/escalate", escalate);

// Dispute resolution
adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:id", getDispute);
adminRoutes.post("/disputes/:id/resolve", resolve);
adminRoutes.post("/disputes/:id/escalate", escalateDispute);

// Platform controls
adminRoutes.get("/controls", getControls);
adminRoutes.post("/controls/toggle", toggleControl);

// Audit log
adminRoutes.get("/audit-log", getAuditLog);
