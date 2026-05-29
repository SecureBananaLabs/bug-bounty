import { Router } from "express";
import {
  audit,
  controls,
  disputes,
  jobs,
  metrics,
  overview,
  setControls,
  setDisputeStatus,
  setJobModeration,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnly);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id/status", setUserStatus);
adminRoutes.get("/jobs", jobs);
adminRoutes.patch("/jobs/:id/moderation", setJobModeration);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:id/ruling", setDisputeStatus);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", setControls);
adminRoutes.get("/audit", audit);
