import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const result = createPaymentIntent(req.body);
  if (!result.success) {
    return fail(res, result.message, 400);
  }

  return ok(res, result.data, 201);
}
