import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const amount = req.body?.amount;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return fail(res, "Payment amount must be greater than 0", 400);
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
