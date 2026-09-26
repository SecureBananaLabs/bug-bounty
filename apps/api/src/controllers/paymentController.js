import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const payload = createPaymentSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Payment amount must be a positive number", 400);
  }

  return ok(res, await createPaymentIntent(payload.data), 201);
}
