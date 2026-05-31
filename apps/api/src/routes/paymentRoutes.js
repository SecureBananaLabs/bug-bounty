import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { createPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", createPayment);
