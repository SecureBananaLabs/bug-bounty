import { env } from "../config/env.js";

export async function createPaymentIntent(payload) {
  if (!env.stripeSecretKey && env.nodeEnv === "production") {
    const err = new Error("Payment processing is not configured");
    err.status = 503;
    throw err;
  }
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
