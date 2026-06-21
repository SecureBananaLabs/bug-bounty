import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { paymentSchema, filterSystemFields } from "../validators/payment.js";

export async function createPayment(req, res) {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid input", 400, parsed.error.issues);
  }

  const clean = filterSystemFields(parsed.data);

  return ok(res, await createPaymentIntent(clean), 201);
}
