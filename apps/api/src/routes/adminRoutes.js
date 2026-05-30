import { Router } from "express";
import {
  metrics, listUsers, updateUser,
  listFlaggedJobs, moderateFlaggedJob,
  listDisputes, settleDispute,
  listAuditLog, patchSettings,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

// Admin-only guard: require role === "admin"
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }
  return next();
}

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", listUsers);
adminRoutes.patch("/users/:id", updateUser);
adminRoutes.get("/jobs/flagged", listFlaggedJobs);
adminRoutes.patch("/jobs/:id/moderate", moderateFlaggedJob);
adminRoutes.get("/disputes", listDisputes);
adminRoutes.patch("/disputes/:id/resolve", settleDispute);
adminRoutes.get("/audit-log", listAuditLog);
adminRoutes.patch("/settings", patchSettings);
