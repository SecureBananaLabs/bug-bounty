import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

export const paymentRoutes = Router();

// Payment intents are tied to the account that pays them, so the route has to
// know which verified caller is asking instead of accepting anonymous posts.
paymentRoutes.post("/", authMiddleware, createPayment);
