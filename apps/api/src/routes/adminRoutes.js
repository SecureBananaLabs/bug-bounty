import { Router } from "express";
import { metrics, changeUserRole } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", asyncHandler(metrics));
adminRoutes.post("/users/:id/role", asyncHandler(changeUserRole));
