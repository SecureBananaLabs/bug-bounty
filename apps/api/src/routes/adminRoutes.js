import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

adminRoutes.get("/metrics", adminController.metrics);
adminRoutes.get("/users", adminController.usersList);
adminRoutes.get("/users/:id", adminController.userProfile);
adminRoutes.post("/users/:id/status", adminController.userStatusUpdate);
adminRoutes.get("/jobs/flagged", adminController.flaggedJobs);
adminRoutes.post("/jobs/:id/moderate", adminController.moderateListing);
adminRoutes.get("/disputes", adminController.disputesList);
adminRoutes.get("/disputes/:id", adminController.disputeDetail);
adminRoutes.post("/disputes/:id/rule", adminController.resolveDispute);
adminRoutes.get("/trust/distribution", adminController.trustDistribution);
adminRoutes.get("/controls", adminController.platformControls);
adminRoutes.post("/controls", adminController.updatePlatformControl);
adminRoutes.get("/audit-log", adminController.auditLogList);
