import { Router } from "express";
import { createPayment, getPayment } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.post("/", createPayment);
paymentRoutes.get("/:id", getPayment);
