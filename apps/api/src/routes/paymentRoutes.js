import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

export const paymentRoutes = Router();

// CRITICAL: All payment operations require authentication.
// Unauthenticated payment creation is a direct financial vulnerability.
paymentRoutes.post("/", authMiddleware, createPayment);
