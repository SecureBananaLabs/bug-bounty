import { ok, badRequest, serverError } from "../utils/response.js";
import { createPaymentIntent, PaymentValidationError } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return badRequest(res, error.message);
    }
    return serverError(res, error.message);
  }
}
