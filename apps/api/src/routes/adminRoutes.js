import { Router } from "express";
import {
  metrics,
  overview,
  platformControls
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);
adminRoutes.get("/metrics", metrics);
adminRoutes.get("/overview", overview);
adminRoutes.patch("/platform-controls", platformControls);
