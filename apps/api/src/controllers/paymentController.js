import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { paymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const result = paymentSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.flatten(), 422);
  }
  return ok(res, await createPaymentIntent(result.data), 201);
}
