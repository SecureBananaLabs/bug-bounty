import { env } from "../config/env.js";

export class PaymentConfigurationError extends Error {
  constructor(message = "Stripe is not configured") {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

function requiresStripeConfiguration(config) {
  return config.nodeEnv === "production";
}

function hasStripeSecret(config) {
  return Boolean(config.stripeSecretKey?.trim());
}

export async function createPaymentIntent(payload, config = env) {
  if (requiresStripeConfiguration(config) && !hasStripeSecret(config)) {
    throw new PaymentConfigurationError();
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
