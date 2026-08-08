import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    const status = error?.type?.startsWith("Stripe") || error?.rawType?.startsWith("Stripe") ? 502 : 400;
    return fail(res, error.message, status);
  }
}
