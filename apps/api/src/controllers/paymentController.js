import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (err) {
    const status = err.statusCode || 500;
    return fail(res, err.message, status);
  }
}
