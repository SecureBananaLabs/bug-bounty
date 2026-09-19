import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
