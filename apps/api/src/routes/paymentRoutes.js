import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", asyncHandler(createPayment));
