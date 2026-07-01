import { fail, ok } from "../utils/response.js";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return fail(res, error.message, 400);
    }

    if (error instanceof PaymentProviderError) {
      return fail(res, error.message, 502);
    }

    throw error;
  }
}
