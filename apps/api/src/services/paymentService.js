import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export function resetStripeClientForTests() {
  stripeClient = undefined;
}

export function setStripeClientForTests(client) {
  stripeClient = client;
}

function getStripeClient() {
  if (!stripeClient) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required to create a payment intent");
    }

    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount is required and must be a positive integer in the smallest currency unit");
  }
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("currency must be a 3-letter ISO currency code");
  }
}

function sanitizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

export async function createPaymentIntent(payload = {}) {
  validateAmount(payload.amount);

  const currency = payload.currency ?? "usd";
  validateCurrency(currency);

  const params = {
    amount: payload.amount,
    currency: currency.toLowerCase()
  };
  const metadata = sanitizeMetadata(payload.metadata);
  if (metadata) {
    params.metadata = metadata;
  }

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: params.amount,
      currency: params.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe")) {
      throw new Error(error.message);
    }

    throw error;
  }
}
