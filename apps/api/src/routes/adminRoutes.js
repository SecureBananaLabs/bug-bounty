import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: admin role required", 403);
  }
  next();
}

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
