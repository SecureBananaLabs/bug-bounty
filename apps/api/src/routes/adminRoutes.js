import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputes,
  flaggedListings,
  metrics,
  setControl,
  setDisputeRuling,
  setListingDecision,
  setUserStatus,
  userProfile,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userProfile);
adminRoutes.patch("/users/:id/status", setUserStatus);
adminRoutes.get("/moderation/jobs", flaggedListings);
adminRoutes.patch("/moderation/jobs/:id", setListingDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.patch("/disputes/:id/ruling", setDisputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", setControl);
adminRoutes.get("/audit-log", auditLog);
