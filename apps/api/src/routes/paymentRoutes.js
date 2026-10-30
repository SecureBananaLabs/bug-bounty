import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const paymentRoutes = Router();

paymentRoutes.post("/", createPayment);
