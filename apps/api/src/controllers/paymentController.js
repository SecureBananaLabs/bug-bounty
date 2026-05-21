import { fail, ok } from "../utils/response.js";
import { createPaymentIntent, PaymentError } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof PaymentError) {
      return fail(res, error.message, error.statusCode);
    }
    throw error;
  }
}
