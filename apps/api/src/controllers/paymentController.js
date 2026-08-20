import { ok } from "../utils/response.js";
import { createPaymentIntent, PaymentValidationError } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(502).json({ error: error.message });
  }
}
