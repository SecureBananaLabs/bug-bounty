import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

import { authMiddleware } from "../middleware/auth.js";

paymentRoutes.post("/", authMiddleware, createPayment);
