import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const amount = req.body?.amount;
  const parsedAmount = typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return fail(res, "amount must be a positive number", 400);
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
