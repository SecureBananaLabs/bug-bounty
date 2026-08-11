import { z } from "zod";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional()
});

export async function createPayment(req, res) {
  const payload = paymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
