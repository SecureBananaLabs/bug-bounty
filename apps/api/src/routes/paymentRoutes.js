import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", asyncHandler(createPayment));
