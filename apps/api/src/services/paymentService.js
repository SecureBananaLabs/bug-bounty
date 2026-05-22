import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClientFactory = (secretKey) => new Stripe(secretKey);

export function setStripeClientFactoryForTest(factory) {
  stripeClientFactory = factory;
}

export function resetStripeClientFactoryForTest() {
  stripeClientFactory = (secretKey) => new Stripe(secretKey);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("payload.amount must be a positive integer in the smallest currency unit");
  }

  const currency = (payload.currency ?? "usd").toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error("payload.currency must be a 3-letter ISO currency code");
  }

  if (payload.metadata !== undefined && (typeof payload.metadata !== "object" || Array.isArray(payload.metadata))) {
    throw new Error("payload.metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency,
    metadata: payload.metadata ?? undefined
  };
}

export async function createPaymentIntent(payload) {
  const request = validatePayload(payload);

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent");
  }

  const stripe = stripeClientFactory(env.stripeSecretKey);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: request.amount,
      currency: request.currency,
      ...(request.metadata ? { metadata: request.metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: request.amount,
      currency: request.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(error?.message || "Stripe PaymentIntent creation failed");
  }
}
