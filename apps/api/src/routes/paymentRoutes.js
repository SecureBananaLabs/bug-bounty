import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const schema = z.object({ amount: z.number().positive(), currency: z.string().optional() }).strict();

export const paymentRoutes = Router();

paymentRoutes.post("/", validate(schema), createPayment);
