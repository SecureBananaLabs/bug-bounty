import { fail, ok } from "../utils/response.js";
import { createPaymentIntent, PaymentConfigurationError } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof PaymentConfigurationError) {
      return fail(res, error.message, 503);
    }
    throw error;
  }
}
