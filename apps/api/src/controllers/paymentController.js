import { fail, ok } from "../utils/response.js";
import { env } from "../config/env.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  if (env.nodeEnv === "production" && !env.stripeSecretKey.trim()) {
    return fail(res, "Payment provider is not configured", 503);
  }

  return ok(res, await createPaymentIntent(req.body), 201);
}
