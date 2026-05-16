import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  return ok(res, await createPaymentIntent(req.body), 201);
}
