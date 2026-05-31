import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const result = createPaymentIntentSchema.safeParse(req.body);

  if (!result.success) {
    return fail(res, "Invalid payment payload", 400);
  }

  return ok(res, await createPaymentIntent(result.data), 201);
}
