import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

export function createPaymentRoutes({ requireAuth = authMiddleware } = {}) {
  const router = Router();
  router.post("/", requireAuth, createPayment);
  return router;
}

export const paymentRoutes = createPaymentRoutes();
