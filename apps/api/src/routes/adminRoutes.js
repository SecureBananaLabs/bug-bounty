import { Router } from "express";
import {
  auditLog,
  changeUserStatus,
  controls,
  disputes,
  metrics,
  moderationQueue,
  resolveDispute,
  reviewListing,
  toggleControl,
  userDetails,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userDetails);
adminRoutes.post("/users/:userId/status", changeUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:listingId", reviewListing);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:disputeId/ruling", resolveDispute);
adminRoutes.get("/controls", controls);
adminRoutes.post("/controls/:controlKey", toggleControl);
adminRoutes.get("/audit-log", auditLog);
