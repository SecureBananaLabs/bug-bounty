import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/resource.js";

export async function createPayment(req, res) {
  const payload = createPaymentSchema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
