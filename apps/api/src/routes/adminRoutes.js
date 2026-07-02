import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireAdminRole } from "../middleware/requireAdminRole.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdminRole);
adminRoutes.get("/metrics", metrics);
