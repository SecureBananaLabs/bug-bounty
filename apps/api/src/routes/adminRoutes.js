import { Router } from "express";
import {
  audit,
  controls,
  disputeQueue,
  metrics,
  moderate,
  moderationQueue,
  ruleDispute,
  setControls,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.post("/moderation/:flagId", moderate);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", setControls);
adminRoutes.get("/audit", audit);
