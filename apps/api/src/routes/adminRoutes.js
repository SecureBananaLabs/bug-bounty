import { Router } from "express";
import { metrics, postManualPayout, getManualPayouts } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", metrics);
adminRoutes.post("/payouts/manual", postManualPayout);
adminRoutes.get("/payouts/manual", getManualPayouts);
