import { fail } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { metrics } from "../controllers/adminController.js";
import { Router } from "express";

export const adminRoutes = Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }
  next();
}

adminRoutes.use(authMiddleware);
adminRoutes.use(requireAdmin);
adminRoutes.get("/metrics", metrics);
