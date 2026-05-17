import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import {
  metrics,
  listUsers, setUserStatus, userDetail,
  listFlaggedJobs, moderateJob,
  listDisputes, resolveDispute,
  setRegistrations, setPostings,
  auditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:userId", userDetail);
adminRoutes.patch("/users/status", setUserStatus);
adminRoutes.get("/flagged-jobs", listFlaggedJobs);
adminRoutes.patch("/flagged-jobs", moderateJob);
adminRoutes.get("/disputes", listDisputes);
adminRoutes.patch("/disputes/resolve", resolveDispute);
adminRoutes.patch("/controls/registrations", setRegistrations);
adminRoutes.patch("/controls/postings", setPostings);
adminRoutes.get("/audit-log", auditLog);
