import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const { amount, currency = "usd" } = req.body;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return fail(res, "Payment amount must be a positive number");
  }

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    return fail(res, "Payment currency must be a 3-letter code");
  }

  return ok(res, await createPaymentIntent({ ...req.body, amount, currency }), 201);
}
