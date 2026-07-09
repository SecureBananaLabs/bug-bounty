import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { paymentSchema } from "../validators/payment.js";

export async function createPayment(req, res, next) {
  try {
    const payload = paymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(payload), 201);
  } catch (err) {
    return next(err);
  }
}
