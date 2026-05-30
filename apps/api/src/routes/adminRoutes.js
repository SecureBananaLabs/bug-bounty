import { Router } from "express";
import { 
  metrics, 
  getUsers, 
  updateUserStatus, 
  getModerationQueue, 
  moderateJob, 
  getDisputes, 
  resolveDispute,
  toggleControl,
  getAuditLog
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminAuth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", getUsers);
adminRoutes.post("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation", getModerationQueue);
adminRoutes.post("/moderation/:id/status", moderateJob);
adminRoutes.get("/disputes", getDisputes);
adminRoutes.post("/disputes/:id/ruling", resolveDispute);
adminRoutes.post("/controls", toggleControl);
adminRoutes.get("/audit", getAuditLog);
