import { createPaymentSchema } from "../validators/payment.js";
import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const payload = createPaymentSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid payment request", 400);
  }

  return ok(res, await createPaymentIntent(payload.data), 201);
}
