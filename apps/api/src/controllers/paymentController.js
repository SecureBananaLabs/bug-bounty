import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

function paymentValidationMessage(error) {
  return error.issues[0]?.message ?? "Invalid payment payload";
}

export async function createPayment(req, res) {
  const payload = createPaymentSchema.safeParse(req.body);
  if (!payload.success) {
    return fail(res, paymentValidationMessage(payload.error), 400);
  }

  return ok(res, await createPaymentIntent(payload.data), 201);
}
