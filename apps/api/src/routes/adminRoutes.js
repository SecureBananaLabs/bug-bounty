import { Router } from "express";
import {
  adminNotifications,
  audit,
  controlUpdate,
  controls,
  disputeDetail,
  disputeRuling,
  disputes,
  metrics,
  moderationAction,
  moderationQueue,
  userDetail,
  userStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", asyncRoute(metrics));
adminRoutes.get("/users", asyncRoute(users));
adminRoutes.get("/users/:userId", asyncRoute(userDetail));
adminRoutes.post("/users/:userId/status", asyncRoute(userStatus));
adminRoutes.get("/moderation/jobs", asyncRoute(moderationQueue));
adminRoutes.post("/moderation/jobs/:jobId", asyncRoute(moderationAction));
adminRoutes.get("/disputes", asyncRoute(disputes));
adminRoutes.get("/disputes/:disputeId", asyncRoute(disputeDetail));
adminRoutes.post("/disputes/:disputeId/ruling", asyncRoute(disputeRuling));
adminRoutes.get("/controls", asyncRoute(controls));
adminRoutes.post("/controls", asyncRoute(controlUpdate));
adminRoutes.get("/audit-log", asyncRoute(audit));
adminRoutes.get("/notifications", asyncRoute(adminNotifications));
