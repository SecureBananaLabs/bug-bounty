import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
