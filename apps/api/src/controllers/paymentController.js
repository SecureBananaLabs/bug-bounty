import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const { amount, currency } = req.body;

  if (amount == null) {
    return fail(res, "Amount is required", 400);
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return fail(res, "Amount must be a positive number", 400);
  }

  return ok(res, await createPaymentIntent({ amount, currency }), 201);
}
