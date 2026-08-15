import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnlyMiddleware);
adminRoutes.get("/metrics", metrics);
