import { ok } from "../utils/response.js";
import { paymentSchema } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const payload = paymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}