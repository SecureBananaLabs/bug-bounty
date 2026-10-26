import { Router } from "express";
import { metrics, users, suspendUser, banUser, approveListing, rejectListing, resolveDispute, togglePlatformSetting, auditLog } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.post("/users/suspend", suspendUser);
adminRoutes.post("/users/ban", banUser);
adminRoutes.post("/listings/approve", approveListing);
adminRoutes.post("/listings/reject", rejectListing);
adminRoutes.post("/disputes/resolve", resolveDispute);
adminRoutes.post("/settings/toggle", togglePlatformSetting);
adminRoutes.get("/audit", auditLog);
