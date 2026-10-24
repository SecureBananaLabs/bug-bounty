import Stripe from "stripe";
import { env } from "../config/env.js";

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Payment payload must be an object");
  }

  const { amount, currency = "usd", metadata } = payload;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TypeError("Payment amount must be a positive integer in the smallest currency unit");
  }

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new TypeError("Payment currency must be a three-letter ISO 4217 code");
  }

  if (metadata !== undefined) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new TypeError("Payment metadata must be an object");
    }
    for (const [key, value] of Object.entries(metadata)) {
      if (!key || value === null || value === undefined || typeof value === "object") {
        throw new TypeError("Payment metadata values must be scalar values");
      }
    }
  }

  return { amount, currency: currency.toLowerCase(), metadata };
}

function createStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a payment intent");
  }
  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload, { stripeClient } = {}) {
  const { amount, currency, metadata } = validatePayload(payload);
  const client = stripeClient ?? createStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create({
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
    throw error;
  }
}
