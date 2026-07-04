import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  try {
    const validated = createPaymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(validated), 201);
  } catch (err) {
    if (err.name === "ZodError" || err.constructor?.name === "ZodError") {
      return fail(res, err.errors, 400);
    }
    return fail(res, err.message || "Invalid request body", 400);
  }
}
