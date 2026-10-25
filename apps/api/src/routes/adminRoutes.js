import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

// Fix #1465: Require authentication + admin role for all admin endpoints
adminRoutes.use(authMiddleware);
adminRoutes.use(requireRole("admin"));

adminRoutes.get("/metrics", metrics);
