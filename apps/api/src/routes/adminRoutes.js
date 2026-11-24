import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireRole("admin"));
adminRoutes.get("/metrics", metrics);
