import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(authorizeRole("admin"));
adminRoutes.get("/metrics", metrics);
