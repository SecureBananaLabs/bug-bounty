import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentIntentSchema } from "../validators/payment.js";

export async function createPayment(req, res, next) {
  let payload;
  try {
    payload = createPaymentIntentSchema.parse(req.body);
  } catch (error) {
    return next(error);
  }
  return ok(res, await createPaymentIntent(payload), 201);
}
