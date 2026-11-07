import { Router } from "express";
import {
  auditLog,
  controls,
  disputeDetail,
  disputes,
  metrics,
  moderationQueue,
  setControl,
  setDisputeRuling,
  setListingDecision,
  setUserStatus,
  userDetail,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userDetail);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation/listings", moderationQueue);
adminRoutes.patch("/moderation/listings/:listingId", setListingDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", disputeDetail);
adminRoutes.patch("/disputes/:disputeId/ruling", setDisputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", setControl);
adminRoutes.get("/audit-log", auditLog);
