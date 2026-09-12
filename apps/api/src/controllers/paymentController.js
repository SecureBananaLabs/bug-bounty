import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(payload), 201);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    throw error;
  }
}
