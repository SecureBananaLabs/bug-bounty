import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: admin role required", 403);
  }
  return next();
}

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
