import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/workflow.js";

export async function createPayment(req, res, next) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(payload), 201);
  } catch (error) {
    return next(error);
  }
}
