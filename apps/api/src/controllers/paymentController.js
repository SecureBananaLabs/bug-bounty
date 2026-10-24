import { ok, fail } from "../utils/response.js";
import {
  createPaymentIntent,
  PaymentValidationError,
  PaymentProviderError,
} from "../services/paymentService.js";

/**
 * POST /api/payments
 * Create a Stripe PaymentIntent.
 *
 * On success (201) the response includes `paymentId`, `clientSecret`,
 * `amount`, and `currency`.
 *
 * Validation errors return 400 with a descriptive message.
 * Stripe provider errors return 502 with the upstream message preserved.
 */
export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return fail(res, error.message, 400);
    }
    if (error instanceof PaymentProviderError) {
      return fail(res, error.message, 502);
    }
    // Unexpected errors
    console.error("Unhandled payment error:", error);
    return fail(res, "Internal server error", 500);
  }
}
