import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const VALID_CURRENCIES = ["usd", "eur", "gbp"];

export async function createPayment(req, res) {
  try {
    const { amount, currency } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return fail(res, "Invalid amount", 400);
    }
    if (currency && !VALID_CURRENCIES.includes(currency)) {
      return fail(res, "Invalid currency", 400);
    }
    return ok(res, await createPaymentIntent({ amount, currency }), 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
