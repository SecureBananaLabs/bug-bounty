import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", authMiddleware, createPayment);
