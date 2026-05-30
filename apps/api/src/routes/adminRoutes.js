import { Router } from "express";
import {
  metrics,
  listDisputes,
  resolveDisputeAction,
  verifyUserAction,
  listAuditLogs
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminRequired } from "../middleware/admin.js";

export const adminRoutes = Router();

// Apply auth middleware and admin role check middleware to all routes
adminRoutes.use(authMiddleware);
adminRoutes.use(adminRequired);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/disputes", listDisputes);
adminRoutes.post("/disputes/resolve", resolveDisputeAction);
adminRoutes.post("/users/verify", verifyUserAction);
adminRoutes.get("/audit-logs", listAuditLogs);
