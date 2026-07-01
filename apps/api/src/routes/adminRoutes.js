import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", requireRole("admin"), metrics);
