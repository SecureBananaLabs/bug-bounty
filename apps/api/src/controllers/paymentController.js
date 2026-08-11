import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { paymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const result = paymentIntentSchema.safeParse(req.body);

  if (!result.success) {
    return fail(res, "Invalid payment payload", 400);
  }

  return ok(res, await createPaymentIntent(result.data), 201);
}
