import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { metrics } from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.get("/metrics", authMiddleware, adminMiddleware, metrics);
