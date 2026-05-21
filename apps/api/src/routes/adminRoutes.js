import { Router } from "express";
import {
  audit,
  controls,
  disputes,
  metrics,
  moderateListing,
  moderationQueue,
  resolveDispute,
  setControls,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin access required", 403);
  }

  return next();
});

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation", moderationQueue);
adminRoutes.patch("/moderation/:listingId", moderateListing);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId/ruling", resolveDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", setControls);
adminRoutes.get("/audit", audit);
