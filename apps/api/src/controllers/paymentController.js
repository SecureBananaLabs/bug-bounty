import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  const currency = req.body.currency ?? "usd";

  if (typeof currency !== "string" || currency.toLowerCase() !== "usd") {
    return fail(res, "payment currency must be usd", 400);
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
