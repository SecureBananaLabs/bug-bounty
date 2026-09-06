import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireRole("admin"));
adminRoutes.get("/metrics", metrics);
