import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminMiddleware);
adminRoutes.get("/metrics", metrics);
