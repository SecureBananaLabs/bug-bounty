import { Router } from "express";
import {
  auditLog,
  controls,
  disputes,
  disputeDetail,
  metrics,
  moderationJobs,
  ruleDispute,
  updateControl,
  updateJobModeration,
  updateUserStatus,
  userDetail,
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
adminRoutes.get("/users/:id", userDetail);
adminRoutes.patch("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", moderationJobs);
adminRoutes.patch("/moderation/jobs/:id", updateJobModeration);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.patch("/disputes/:id/rule", ruleDispute);
adminRoutes.get("/controls", controls);
adminRoutes.patch("/controls/:key", updateControl);
adminRoutes.get("/audit-log", auditLog);
