import { Router } from "express";
import {
  auditLog,
  controls,
  decideDispute,
  decideJob,
  disputes,
  flaggedJobs,
  notifications,
  overview,
  setControl,
  setUserStatus,
  userProfile,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: admin role required", 403);
  }
  return next();
});

adminRoutes.get("/overview", overview);
adminRoutes.get("/metrics", overview);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:userId", userProfile);
adminRoutes.patch("/users/:userId/status", setUserStatus);
adminRoutes.get("/moderation/jobs", flaggedJobs);
adminRoutes.post("/moderation/jobs/:jobId/decision", decideJob);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:disputeId/ruling", decideDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls", setControl);
adminRoutes.get("/audit-log", auditLog);
adminRoutes.get("/notifications", notifications);
