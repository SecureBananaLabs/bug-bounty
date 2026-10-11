import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

export function __setStripeClientForTests(client) {
  stripeClient = client;
}

export function validatePaymentIntentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount is required and must be a positive integer in the smallest currency unit");
  }

  const currency = typeof payload.currency === "string" && payload.currency.trim()
    ? payload.currency.trim().toLowerCase()
    : "usd";

  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error("currency must be a three-letter ISO currency code");
  }

  return {
    amount: payload.amount,
    currency,
    metadata: payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
      ? payload.metadata
      : undefined
  };
}

export async function createPaymentIntent(payload) {
  const { amount, currency, metadata } = validatePaymentIntentPayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error?.message ?? "Stripe payment intent creation failed";
    throw new Error(`Stripe payment intent creation failed: ${message}`);
  }
}
