import { Router } from "express";
import {
  banUser,
  getDispute,
  getDisputes,
  getFlaggedJobs,
  getMetrics,
  getUser,
  getUsers,
  moderateFlaggedJob,
  reinstateUser,
  resolveDispute,
  suspendUser
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/users", getUsers);
adminRoutes.get("/users/:userId", getUser);
adminRoutes.post("/users/:userId/suspend", suspendUser);
adminRoutes.patch("/users/:userId/suspend", suspendUser);
adminRoutes.post("/users/:userId/reinstate", reinstateUser);
adminRoutes.patch("/users/:userId/reinstate", reinstateUser);
adminRoutes.post("/users/:userId/ban", banUser);
adminRoutes.patch("/users/:userId/ban", banUser);

adminRoutes.get("/jobs/flagged", getFlaggedJobs);
adminRoutes.post("/jobs/:jobId/moderate", moderateFlaggedJob);
adminRoutes.patch("/jobs/:jobId/moderate", moderateFlaggedJob);

adminRoutes.get("/disputes", getDisputes);
adminRoutes.get("/disputes/:disputeId", getDispute);
adminRoutes.post("/disputes/:disputeId/rule", resolveDispute);
adminRoutes.patch("/disputes/:disputeId/rule", resolveDispute);

adminRoutes.get("/metrics", getMetrics);
