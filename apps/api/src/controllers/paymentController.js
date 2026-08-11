import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export function createPayment(req, res, next) {
  const payload = createPaymentSchema.parse(req.body);
  return Promise.resolve(createPaymentIntent(payload))
    .then((result) => ok(res, result, 201))
    .catch(next);
}
