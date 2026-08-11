import { createPaymentSchema } from "../validators/payment.js";
import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues[0]?.message ?? "Invalid payment", 400);
  }

  return ok(res, await createPaymentIntent(parsed.data), 201);
}
