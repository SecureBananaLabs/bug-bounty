import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const result = await createPaymentIntent(req.body);

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result, 201);
}
