import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = env.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function validatePaymentPayload(payload) {
  const amount = payload?.amount;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("payload.amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";

  if (typeof currency !== "string" || currency.trim() === "") {
    throw new Error("payload.currency must be a non-empty string");
  }

  const params = {
    amount,
    currency: currency.trim().toLowerCase()
  };

  if (payload.metadata !== undefined) {
    if (payload.metadata === null || typeof payload.metadata !== "object" || Array.isArray(payload.metadata)) {
      throw new Error("payload.metadata must be an object when provided");
    }

    params.metadata = payload.metadata;
  }

  return params;
}

export async function createPaymentIntent(payload) {
  const params = validatePaymentPayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(params);

    if (!paymentIntent?.id || !paymentIntent?.client_secret) {
      throw new Error("Stripe response did not include a payment intent id and client secret");
    }

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe error";
    const wrappedError = new Error(`Stripe payment intent creation failed: ${message}`);
    wrappedError.cause = error;
    throw wrappedError;
  }
}

export function setStripeClientForTest(client) {
  stripeClient = client;
}
