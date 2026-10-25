import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    const { amount, currency } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }
    const allowedCurrencies = ["usd", "eur", "gbp"];
    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({ error: "Invalid currency" });
    }
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (err) {
    next(err);
  }
}
