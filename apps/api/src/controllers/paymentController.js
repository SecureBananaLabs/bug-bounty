import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res, next) {
  try {
    const validated = createPaymentSchema.parse(req.body);
    const result = await createPaymentIntent(validated);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}
