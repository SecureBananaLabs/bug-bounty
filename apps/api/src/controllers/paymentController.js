import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const amount = req.body.amount;
  if (typeof amount !== "number" || amount <= 0) {
    return fail(res, "Amount must be a positive number", 400);
  }
  return ok(res, await createPaymentIntent(req.body), 201);
}
