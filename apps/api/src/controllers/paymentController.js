import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    const status = error.status || error.statusCode || 400;
    return fail(res, error.message, status);
  }
}
