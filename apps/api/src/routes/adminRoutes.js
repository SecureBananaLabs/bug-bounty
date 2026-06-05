import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminGuard } from "../middleware/adminGuard.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", adminGuard, metrics);
