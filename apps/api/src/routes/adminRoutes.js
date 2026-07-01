import { Router } from "express";
import {
  audit,
  controls,
  disputeQueue,
  disputeRuling,
  metrics,
  moderateJob,
  moderationQueue,
  setControl,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:listingId/actions", moderateJob);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/rulings", disputeRuling);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:control", setControl);
adminRoutes.get("/audit-log", audit);
