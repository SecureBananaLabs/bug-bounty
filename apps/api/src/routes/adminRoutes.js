import { Router } from "express";
import {
  auditLog,
  controlUpdate,
  controls,
  disputeResolution,
  disputes,
  jobAction,
  jobs,
  metrics,
  overview,
  userAction,
  users
} from "../controllers/adminController.js";
import { adminOnly } from "../middleware/admin.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/overview", overview);
adminRoutes.get("/users", users);
adminRoutes.post("/users/:id/actions", userAction);
adminRoutes.get("/jobs", jobs);
adminRoutes.post("/jobs/:id/actions", jobAction);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:id/resolve", disputeResolution);
adminRoutes.get("/platform-controls", controls);
adminRoutes.post("/platform-controls/:id", controlUpdate);
adminRoutes.get("/audit-log", auditLog);
