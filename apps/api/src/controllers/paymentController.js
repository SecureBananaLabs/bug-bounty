import { createPaymentSchema } from "../validators/payment.js";
import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "Payment amount must be a positive number", 400);
  }

  return ok(res, await createPaymentIntent(parsed.data), 201);
}
