import { ok, fail } from "../utils/response.js";
import { createPaymentIntent, getPaymentById } from "../services/paymentService.js";

export async function createPayment(req, res) {
  return ok(res, await createPaymentIntent(req.body), 201);
}

export async function getPayment(req, res) {
  const payment = await getPaymentById(req.params.id);
  if (!payment) {
    return fail(res, "Payment not found", 404);
  }
  return ok(res, payment);
}
