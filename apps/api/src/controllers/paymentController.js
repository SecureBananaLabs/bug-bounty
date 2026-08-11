import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { z } from "zod";

export async function createPayment(req, res) {
  const schema = z.object({ amount: z.number().positive(), jobId: z.string().min(1) });
  const payload = schema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
