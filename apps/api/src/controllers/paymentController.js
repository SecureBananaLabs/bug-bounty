import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const payload = createPaymentIntentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
