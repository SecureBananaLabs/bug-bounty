import { Router } from "express";
import {
  auditLog,
  controlList,
  disputeList,
  listingModerationList,
  metrics,
  setControl,
  setDisputeRuling,
  setListingDecision,
  setUserStatus,
  userDetail,
  userList
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", userList);
adminRoutes.get("/users/:userId", userDetail);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation", listingModerationList);
adminRoutes.patch("/moderation/:listingId", setListingDecision);
adminRoutes.get("/disputes", disputeList);
adminRoutes.patch("/disputes/:disputeId", setDisputeRuling);
adminRoutes.get("/controls", controlList);
adminRoutes.patch("/controls/:controlKey", setControl);
adminRoutes.get("/audit-log", auditLog);
