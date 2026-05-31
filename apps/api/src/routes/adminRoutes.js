import { Router } from "express";
import {
  audit,
  decideDispute,
  decideModeration,
  dispute,
  disputes,
  metrics,
  moderation,
  settings,
  updateSettings,
  updateUser,
  userProfile,
  users
} from "../controllers/adminController.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", updateUser);
adminRoutes.get("/moderation", moderation);
adminRoutes.post("/moderation/:listingId/decision", decideModeration);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:disputeId", dispute);
adminRoutes.post("/disputes/:disputeId/ruling", decideDispute);
adminRoutes.get("/settings", settings);
adminRoutes.patch("/settings", updateSettings);
adminRoutes.get("/audit", audit);
