import { ok } from "../utils/response.js";
import { z } from "zod";
import { createPaymentIntent } from "../services/paymentService.js";

const paymentSchema = z.object({
  jobId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default("usd"),
  payerId: z.string().min(1),
  payeeId: z.string().min(1)
});

export async function createPayment(req, res) {
  const payload = paymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
