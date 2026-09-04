import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const result = createPaymentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: result.error.issues
    });
  }

  try {
    return ok(res, await createPaymentIntent(result.data.priceId), 201);
  } catch (error) {
    if (error.code === "PRICE_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "Unknown price id"
      });
    }

    throw error;
  }
}
