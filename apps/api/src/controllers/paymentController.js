import { ok, fail } from "../utils/response.js";
import { createPaymentIntent, PaymentError } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (err) {
    if (err instanceof PaymentError) {
      return fail(res, err.message, err.status);
    }
    throw err;
  }
}