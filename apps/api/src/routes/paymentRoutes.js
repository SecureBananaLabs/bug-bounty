import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.use(authMiddleware);
paymentRoutes.post("/", createPayment);
