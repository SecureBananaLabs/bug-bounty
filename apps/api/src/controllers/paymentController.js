import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    if (error.name === "ValidationError") {
      return fail(res, error.message, 400);
    }
    if (error.name === "ConfigurationError") {
      return fail(res, error.message, 500);
    }
    // Stripe errors preserve their original message
    if (error.type && error.type.startsWith("Stripe")) {
      return fail(res, error.message, error.statusCode || 402);
    }
    return fail(res, "Internal server error", 500);
  }
}
