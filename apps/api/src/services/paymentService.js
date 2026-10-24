import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function validatePaymentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("Payment amount is required and must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency.trim())) {
    throw new Error("Payment currency must be a three-letter ISO currency code");
  }

  if (payload.metadata !== undefined && (payload.metadata === null || typeof payload.metadata !== "object" || Array.isArray(payload.metadata))) {
    throw new Error("Payment metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency: currency.trim().toLowerCase(),
    metadata: payload.metadata
  };
}

export async function createPaymentIntent(payload, client) {
  const params = validatePaymentPayload(payload);
  const stripe = client ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      ...(params.metadata ? { metadata: params.metadata } : {})
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a client secret for the payment intent");
    }

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: params.amount,
      currency: params.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe error";
    throw new Error(`Stripe payment intent failed: ${message}`, { cause: error });
  }
}

export async function createStripePaymentIntentSmokeTest() {
  return createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      smokeTest: "true"
    }
  });
}
