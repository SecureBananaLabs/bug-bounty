import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden: admin role required" });
  }
  return next();
}

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminOnly);
adminRoutes.get("/metrics", metrics);
