import { Router } from "express";
import { createPayment, getPayment, getPayments } from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.get("/", getPayments);
paymentRoutes.get("/:id", getPayment);
paymentRoutes.post("/", createPayment);
