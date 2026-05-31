import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin privileges required", 403);
  }
  return next();
}

adminRoutes.get("/metrics", requireAdmin, metrics);