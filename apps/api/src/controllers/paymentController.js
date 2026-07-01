import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const { amount, currency } = req.body ?? {};

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return fail(res, "Payment amount must be a positive number", 400);
  }

  if (currency !== undefined) {
    if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency.trim())) {
      return fail(res, "Payment currency must be a 3-letter code", 400);
    }
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
