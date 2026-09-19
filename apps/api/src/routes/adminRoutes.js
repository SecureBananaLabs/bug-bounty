import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputes,
  metrics,
  moderationJobs,
  ruleDispute,
  setControl,
  setListingDecision,
  setUserStatus,
  userDetail,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.post("/users/:id/status", setUserStatus);
adminRoutes.get("/moderation/jobs", moderationJobs);
adminRoutes.post("/moderation/jobs/:id/decision", setListingDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.post("/disputes/:id/ruling", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.post("/controls/:key", setControl);
adminRoutes.get("/audit-log", auditLog);
