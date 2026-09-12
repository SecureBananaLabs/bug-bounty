import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { validateCreatePayment } from "../validators/payment.js";

export async function createPayment(req, res) {
  const validation = validateCreatePayment(req.body);
  if (!validation.valid) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createPaymentIntent(validation.data), 201);
}
