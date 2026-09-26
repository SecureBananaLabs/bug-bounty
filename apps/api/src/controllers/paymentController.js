import { fail, ok } from "../utils/response.js";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return fail(res, error.message, error.statusCode);
    }

    throw error;
  }
}
