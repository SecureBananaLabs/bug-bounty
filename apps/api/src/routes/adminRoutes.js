import { Router } from "express";
import {
  audit,
  disputeQueue,
  moderateJob,
  moderationQueue,
  overview,
  ruleDispute,
  setPlatformControl,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", overview);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:listingId", moderateJob);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", ruleDispute);
adminRoutes.patch("/controls/:control", setPlatformControl);
adminRoutes.get("/audit", audit);
