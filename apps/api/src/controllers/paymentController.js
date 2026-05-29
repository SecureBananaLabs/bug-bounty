import { createPaymentSchema } from "../validators/payment.js";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  return ok(res, await createPaymentIntent(createPaymentSchema.parse(req.body)), 201);
}
