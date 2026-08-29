import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const { amount } = req.body || {};
  if (!amount || typeof amount !== "number" || amount <= 0) return fail(res, "Valid positive amount is required.", 400);

  return ok(res, await createPaymentIntent(req.body), 201);
}
