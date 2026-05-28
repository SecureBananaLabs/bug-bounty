import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", catchAsync(metrics));
