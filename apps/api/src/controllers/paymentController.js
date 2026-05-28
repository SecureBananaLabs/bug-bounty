import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const payload = { ...req.body, userId: req.user.sub };
  return ok(res, await createPaymentIntent(payload), 201);
}
