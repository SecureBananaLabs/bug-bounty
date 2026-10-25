import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const result = createPaymentSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment payload",
      errors: result.error.errors
    });
  }

  return ok(res, await createPaymentIntent(result.data), 201);
}
