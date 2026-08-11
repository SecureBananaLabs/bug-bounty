import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

export const paymentRoutes = Router();

paymentRoutes.use(authMiddleware);
paymentRoutes.post("/", createPayment);mport { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", createPayment);
