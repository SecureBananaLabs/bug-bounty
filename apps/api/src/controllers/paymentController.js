import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Payment creation failed";
    return fail(res, message, status);
  }
}
