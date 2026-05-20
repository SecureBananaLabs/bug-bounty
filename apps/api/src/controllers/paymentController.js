import { createPaymentIntent, PaymentError, mapStripeError } from "../services/paymentService.js";
import { ok, fail } from "../utils/response.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (err) {
    const error = mapStripeError(err);
    return fail(res, error.message, error.statusCode);
  }
}