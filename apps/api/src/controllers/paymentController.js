import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const result = createPaymentSchema.safeParse(req.body);

  if (!result.success) {
    return fail(res, "Invalid payment payload", 400);
  }

  return ok(res, await createPaymentIntent(result.data), 201);
}
