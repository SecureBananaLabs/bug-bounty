import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/index.js";

export async function createPayment(req, res) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(payload), 201);
  } catch (err) {
    if (err.name === "ZodError") {
      return fail(res, "Validation failed", 400);
    }
    throw err;
  }
}
