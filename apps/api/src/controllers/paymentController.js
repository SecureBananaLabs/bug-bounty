import { z } from "zod";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().max(500).optional(),
});

export async function createPayment(req, res) {
  const validated = paymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(validated), 201);
}
