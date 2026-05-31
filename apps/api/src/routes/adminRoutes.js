import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { CustomError } from "../utils/error.js";

export const adminRoutes = Router();

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new CustomError("Access denied. Admins only.", 403);
  }
  next();
};

adminRoutes.use(authMiddleware, adminMiddleware);
adminRoutes.get("/metrics", metrics);

