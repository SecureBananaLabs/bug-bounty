import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", metrics);
