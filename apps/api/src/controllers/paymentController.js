import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (err) {
    if (err.status === 400) return fail(res, err.message, 400);
    return next(err);
  }
}
