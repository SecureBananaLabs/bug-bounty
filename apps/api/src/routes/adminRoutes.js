import { Router } from "express";
import {
  auditLog,
  controls,
  disputes,
  disputeDetails,
  jobModeration,
  metrics,
  ruleDispute,
  updateControls,
  updateListing,
  updateUser,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id/status", updateUser);
adminRoutes.get("/moderation/jobs", jobModeration);
adminRoutes.post("/moderation/jobs/:id/decision", updateListing);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetails);
adminRoutes.post("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", updateControls);
adminRoutes.get("/audit-log", auditLog);
