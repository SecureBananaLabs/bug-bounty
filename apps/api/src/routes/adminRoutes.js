import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin access required", 403);
  }
  next();
};

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
