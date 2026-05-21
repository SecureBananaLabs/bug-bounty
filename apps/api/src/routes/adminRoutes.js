import { Router } from "express";
import {
  audit,
  disputes,
  metrics,
  moderation,
  overview,
  setDisputeRuling,
  setListingDecision,
  setPlatformControl,
  setUserStatus,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin role required", 403);
  }
  return next();
});
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation", moderation);
adminRoutes.patch("/moderation/:listingId", setListingDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:disputeId/ruling", setDisputeRuling);
adminRoutes.patch("/controls/:key", setPlatformControl);
adminRoutes.get("/audit", audit);
