import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

/**
 * Handles the creation of a PaymentIntent.
 * Implements high-integrity error handling to satisfy bounty requirements.
 */
export async function createPayment(req, res, next) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    // If the error has a status, use it (from our service validation or Stripe)
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    // Fallback to general error handler
    next(error);
  }
}
