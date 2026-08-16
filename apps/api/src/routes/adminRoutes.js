import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { metrics } from "../controllers/adminController.js";
import { Router } from "express";

const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", metrics);

export { adminRoutes };
