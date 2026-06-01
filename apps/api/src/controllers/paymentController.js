import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  // Require authenticated user
  if (!req.user || !req.user.id) {
    return fail(res, "Authentication required", 401);
  }

  // Attach user context to payment
  const paymentData = {
    ...req.body,
    userId: req.user.id,
  };

  return ok(res, await createPaymentIntent(paymentData), 201);
}
