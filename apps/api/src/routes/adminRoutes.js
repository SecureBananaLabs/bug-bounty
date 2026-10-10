import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, requireAdminRole } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdminRole);
adminRoutes.get("/metrics", metrics);
