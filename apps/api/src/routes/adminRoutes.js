import { Router } from "express";
import {
  audit,
  controls,
  decideDispute,
  decideListing,
  disputeQueue,
  metrics,
  moderationQueue,
  setControl,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/admin.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.post("/moderation/:listingId/decision", decideListing);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", decideDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:control", setControl);
adminRoutes.get("/audit", audit);
