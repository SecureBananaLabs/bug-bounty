import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", authMiddleware, createPayment);
