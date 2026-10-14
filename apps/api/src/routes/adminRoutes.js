import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

// authMiddleware verifies the token; requireRole("admin") checks the role.
// Previously authMiddleware was applied but there was no role check —
// any authenticated user (client, freelancer) could read admin metrics.
adminRoutes.use(authMiddleware, requireRole("admin"));
adminRoutes.get("/metrics", metrics);

