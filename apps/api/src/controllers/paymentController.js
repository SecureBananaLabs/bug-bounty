import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const payload = createPaymentSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: payload.error.issues
    });
  }

  return ok(res, await createPaymentIntent(payload.data), 201);
}
