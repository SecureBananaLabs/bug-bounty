import { Router } from "express";
import {
  audit,
  controls,
  decideListing,
  disputeQueue,
  disputeRuling,
  metrics,
  moderationQueue,
  overview,
  setControl,
  setUserStatus,
  userProfile,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/overview", overview);

adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", setUserStatus);

adminRoutes.get("/moderation", moderationQueue);
adminRoutes.patch("/moderation/:jobId", decideListing);

adminRoutes.get("/disputes", disputeQueue);
adminRoutes.patch("/disputes/:disputeId/ruling", disputeRuling);

adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:control", setControl);

adminRoutes.get("/audit", audit);
