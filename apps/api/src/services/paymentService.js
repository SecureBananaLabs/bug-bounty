import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create Stripe payment intents");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

function validatePaymentPayload(payload = {}) {
  const amount = payload.amount;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("Payment currency must be a three-letter ISO currency code");
  }

  const metadata = payload.metadata ?? {};
  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Payment metadata must be an object when provided");
  }

  return {
    amount,
    currency: currency.toLowerCase(),
    metadata
  };
}

function normalizeStripeError(error) {
  const message = error?.message ?? "Stripe payment intent creation failed";
  return new Error(`Stripe payment intent creation failed: ${message}`);
}

export async function createPaymentIntent(payload) {
  return createPaymentIntentWithClient(payload, getStripeClient());
}

export async function createPaymentIntentWithClient(payload, client) {
  const { amount, currency, metadata } = validatePaymentPayload(payload);

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount,
      currency,
      metadata
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    throw normalizeStripeError(error);
  }
}
