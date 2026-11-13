import { ok } from "../utils/response.js";
import { createPaymentSchema } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const payload = createPaymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
