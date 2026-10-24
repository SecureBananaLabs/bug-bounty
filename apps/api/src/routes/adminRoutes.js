import { Router } from "express";
import { auditLog, controls, disputeQueue, disputeRuling, metrics, moderateListing, moderationQueue, updateControl, updateUserStatus, users } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationQueue);
adminRoutes.post("/moderation/jobs/:listingId/decision", moderateListing);
adminRoutes.get("/disputes", disputeQueue);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/platform-controls", controls);
adminRoutes.patch("/platform-controls/:key", updateControl);
adminRoutes.get("/audit-log", auditLog);

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}
