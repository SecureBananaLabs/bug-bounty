import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const SUPPORTED_CURRENCIES = ["usd"];

function validatePayment(body) {
  const { amount, currency } = body;
  if (amount === undefined || amount === null) {
    return "amount is required";
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "amount must be a number";
  }
  if (amount <= 0) {
    return "amount must be positive";
  }
  if (currency !== undefined && currency !== null) {
    if (typeof currency !== "string") {
      return "currency must be a string";
    }
    if (!SUPPORTED_CURRENCIES.includes(currency.toLowerCase())) {
      return `currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`;
    }
  }
  return null;
}

export async function createPayment(req, res) {
  const err = validatePayment(req.body);
  if (err) return fail(res, err);
  return ok(res, await createPaymentIntent(req.body), 201);
}
