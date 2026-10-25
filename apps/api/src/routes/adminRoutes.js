import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
});
adminRoutes.get("/metrics", metrics);
