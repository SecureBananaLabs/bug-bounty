import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const payload = createPaymentIntentSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Payment amount must be a positive number");
  }

  return ok(res, await createPaymentIntent(payload.data), 201);
}
