import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

// Require authentication
adminRoutes.use(authMiddleware);

// Require admin role
adminRoutes.use((req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Admin access required", 403);
  }
  next();
});

adminRoutes.get("/metrics", metrics);
