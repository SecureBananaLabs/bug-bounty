import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createPayment } from "../controllers/paymentController.js";

const payLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15 });

export const paymentRoutes = Router();

paymentRoutes.post("/", payLimiter, createPayment);
