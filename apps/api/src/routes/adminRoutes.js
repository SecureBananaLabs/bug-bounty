import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

adminRoutes.use(authMiddleware, requireAdmin);
adminRoutes.get("/metrics", metrics);
