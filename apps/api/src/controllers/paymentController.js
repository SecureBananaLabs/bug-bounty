import { ok, fail } from "../utils/response.js";
import { createPaymentSchema } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const result = createPaymentSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.issues[0].message, 400);
  }
  return ok(res, await createPaymentIntent(result.data), 201);
}
