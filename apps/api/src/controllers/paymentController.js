import { ok, fail } from "../utils/response.js";
import { validateCreatePayment } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const validation = validateCreatePayment(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createPaymentIntent(validation.data), 201);
}

