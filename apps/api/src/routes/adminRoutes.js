import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);
