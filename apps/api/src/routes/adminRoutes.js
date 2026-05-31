import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authMiddleware, adminRoleGuard } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminRoleGuard);

adminRoutes.get("/metrics", adminController.metrics);
adminRoutes.get("/users", adminController.getUsers);
adminRoutes.patch("/users/:id/status", adminController.updateUserStatus);
adminRoutes.get("/moderation-queue", adminController.getModerationQueue);
adminRoutes.post("/moderation/:id/:action", adminController.handleModeration);
adminRoutes.get("/disputes", adminController.getDisputes);
adminRoutes.post("/disputes/:id/resolve", adminController.resolveDispute);
adminRoutes.get("/audit-logs", adminController.getAuditLogs);
adminRoutes.post("/platform-controls", adminController.updatePlatformControls);
