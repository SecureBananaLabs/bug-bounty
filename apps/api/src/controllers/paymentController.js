import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { paymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const payload = paymentIntentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
