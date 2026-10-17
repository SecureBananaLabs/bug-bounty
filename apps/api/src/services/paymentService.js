import { env } from "../config/env.js";

export class PaymentConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

export async function createPaymentIntent(payload) {
  if (env.nodeEnv === "production" && !env.stripeSecretKey) {
    throw new PaymentConfigurationError("Stripe is not configured");
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
