import { env } from "../config/env.js";

let stripeClient = null;

export async function getStripeClient() {
  if (!stripeClient) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not configured");
    }
    const { default: Stripe } = await import("stripe");
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

export function setStripeClient(customClient) {
  stripeClient = customClient;
}

export async function createPaymentIntent(payload, options = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payment payload is required");
  }

  const { amount, currency = "usd", metadata } = payload;

  if (amount === undefined || amount === null) {
    throw new Error("payload.amount is required");
  }

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("payload.amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const client = options.stripeClient || (await getStripeClient());

  const createParams = {
    amount,
    currency: (currency || "usd").toLowerCase()
  };

  if (metadata && typeof metadata === "object") {
    createParams.metadata = metadata;
  }

  try {
    const paymentIntent = await client.paymentIntents.create(createParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? createParams.currency,
      provider: "stripe",
      status: paymentIntent.status
    };
  } catch (error) {
    const message = error?.message || "Stripe API error during payment intent creation";
    const paymentError = new Error(message);
    paymentError.name = error?.name || "StripeError";
    paymentError.type = error?.type;
    paymentError.code = error?.code;
    paymentError.raw = error;
    throw paymentError;
  }
}
