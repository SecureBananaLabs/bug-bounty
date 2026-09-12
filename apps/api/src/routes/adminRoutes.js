import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", adminMiddleware, metrics);
