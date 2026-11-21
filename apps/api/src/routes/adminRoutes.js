import { Router } from "express";
import {
  audit,
  disputeRuling,
  disputes,
  listingDecision,
  moderation,
  overview,
  platformSetting,
  setUserStatus,
  settings,
  userProfile,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: admin role required", 403);
  }

  return next();
}

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", overview);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.post("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation", moderation);
adminRoutes.post("/moderation/:listingId/decision", listingDecision);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:disputeId/ruling", disputeRuling);
adminRoutes.get("/settings", settings);
adminRoutes.post("/settings/:setting", platformSetting);
adminRoutes.get("/audit", audit);
