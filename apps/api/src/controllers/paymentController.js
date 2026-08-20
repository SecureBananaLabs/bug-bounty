import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return fail(res, firstError.message, 400);
  }

  try {
    const result = await createPaymentIntent(parsed.data);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}
