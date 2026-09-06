import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { adminMiddleware } from "../middleware/admin.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);
