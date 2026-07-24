import Stripe from "stripe";
import { env } from "../config/env.js";

function createStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent");
  }

  return new Stripe(env.stripeSecretKey);
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("payload.amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("payload.currency must be a three-letter ISO currency code");
  }

  if (
    payload.metadata !== undefined &&
    (!payload.metadata || typeof payload.metadata !== "object" || Array.isArray(payload.metadata))
  ) {
    throw new Error("payload.metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: payload.metadata ?? {}
  };
}

export async function createPaymentIntent(payload, stripeClient = createStripeClient()) {
  const paymentPayload = validatePaymentPayload(payload);

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(paymentPayload);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    };
  } catch (error) {
    if (error?.message) {
      throw new Error(error.message);
    }

    throw error;
  }
}
