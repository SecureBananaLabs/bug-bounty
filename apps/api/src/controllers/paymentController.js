import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  if (req.body?.amount <= 0) {
    return fail(res, "Amount must be greater than 0", 400);
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
