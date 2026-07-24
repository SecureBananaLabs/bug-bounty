import { env } from "../config/env.js";

export async function createPaymentIntent(payload) {
  if (env.nodeEnv === "production" && !env.stripeSecretKey) {
    const error = new Error("Payment provider is not configured");
    error.status = 503;
    error.statusCode = 503;
    throw error;
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
