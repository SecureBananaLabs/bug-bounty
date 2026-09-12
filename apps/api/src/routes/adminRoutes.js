import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { adminRoleMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminRoleMiddleware);
adminRoutes.get("/metrics", metrics);
