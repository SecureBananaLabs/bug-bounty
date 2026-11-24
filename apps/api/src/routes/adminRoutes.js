import { Router } from "express";
import {
  auditLog,
  changeDisputeStatus,
  changeListingStatus,
  changePlatformControl,
  changeUserStatus,
  disputeQueue,
  metrics,
  moderationQueue,
  platformControls,
  userDetails,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userDetails);
adminRoutes.patch("/users/:userId/status", changeUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.patch("/moderation/jobs/:jobId", changeListingStatus);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.patch("/disputes/:disputeId/ruling", changeDisputeStatus);
adminRoutes.get("/controls", platformControls);
adminRoutes.patch("/controls/:key", changePlatformControl);
adminRoutes.get("/audit-log", auditLog);

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin access required", 403);
  }

  return next();
}
