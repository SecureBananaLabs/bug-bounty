import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const parsed = createPaymentIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "amount must be a positive finite number");
  }

  return ok(res, await createPaymentIntent(parsed.data), 201);
}
