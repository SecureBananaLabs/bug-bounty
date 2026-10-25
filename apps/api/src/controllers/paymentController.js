import { fail, ok } from "../utils/response.js";
import { createPaymentIntent, isSupportedPaymentCurrency } from "../services/paymentService.js";

export async function createPayment(req, res) {
  if (!isSupportedPaymentCurrency(req.body?.currency)) {
    return fail(res, "Unsupported payment currency");
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
