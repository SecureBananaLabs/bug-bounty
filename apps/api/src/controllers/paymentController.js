import { z } from "zod";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const createPaymentSchema = z.object({
  userId: z.string().min(1),
  proposalId: z.string().min(1),
  amount: z.number().positive().max(1000000),
  currency: z.string().length(3).default("USD")
});

export async function createPayment(req, res) {
  const payload = createPaymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
