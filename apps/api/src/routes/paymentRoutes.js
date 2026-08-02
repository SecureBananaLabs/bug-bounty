import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createPayment } from "../controllers/paymentController.js";

paymentRoutes.use(authMiddleware);

export const paymentRoutes = Router();

paymentRoutes.post("/", createPayment);
