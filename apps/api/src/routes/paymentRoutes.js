import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

export const paymentRoutes = Router();

// A payment intent is tied to the account that funds it, so the handler needs
// the verified bearer identity instead of answering every anonymous caller.
paymentRoutes.use(authMiddleware);

paymentRoutes.post("/", createPayment);
