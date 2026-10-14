import { ok, fail } from "../utils/response.js";
import { createPaymentSchema } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues.map(i => i.message).join("; "), 400);
  }
  return ok(res, await createPaymentIntent(parsed.data), 201);
}
