import { fail, ok } from "../utils/response.js";
import { PaymentValidationError, createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return fail(res, error.message, 400);
    }

    throw error;
  }
}
