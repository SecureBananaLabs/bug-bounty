import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

/**
 * Admin middleware — verify user has admin role.
 * Must be applied AFTER authMiddleware so req.user is populated.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Forbidden: admin access required", 403);
  }
  next();
}

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);
