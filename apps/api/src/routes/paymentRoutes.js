import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", authenticate, createPayment);
