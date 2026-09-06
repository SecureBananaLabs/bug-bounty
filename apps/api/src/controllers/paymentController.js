import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const VALID_CURRENCIES = ["usd", "eur", "gbp", "inr", "cad", "aud"];

export async function createPayment(req, res) {
  const { amount, currency } = req.body || {};
  if (typeof amount !== "number" || amount <= 0) {
    return fail(res, "Amount must be a positive number", 400);
  }
  if (typeof currency !== "string" || !VALID_CURRENCIES.includes(currency.toLowerCase())) {
    return fail(res, "Invalid or unsupported currency", 400);
  }
  return ok(res, await createPaymentIntent({ amount, currency: currency.toLowerCase() }), 201);
}
