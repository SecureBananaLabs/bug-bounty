import { Router } from "express";
import {
  auditLog,
  controls,
  disputes,
  jobs,
  metrics,
  overview,
  updateControl,
  updateJobReview,
  updateUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnlyMiddleware } from "../middleware/admin.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnlyMiddleware);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/jobs", jobs);
adminRoutes.patch("/jobs/:jobId/review", updateJobReview);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:controlKey", updateControl);
adminRoutes.get("/audit-log", auditLog);
