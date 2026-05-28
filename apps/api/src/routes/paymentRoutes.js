import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { createPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", catchAsync(createPayment));
