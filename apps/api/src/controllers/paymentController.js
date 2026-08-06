import { fail, ok } from "../utils/response.js";
import { createPaymentSchema } from "../validators/body.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, { issues: parsed.error.issues });
  }

  return ok(res, await createPaymentIntent(parsed.data), 201);
}
