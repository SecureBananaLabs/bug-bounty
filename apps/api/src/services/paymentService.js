import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export function setStripeClientForTests(client) {
  stripeClient = client;
}

export function resetStripeClientForTests() {
  stripeClient = undefined;
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a payment intent");
  }

  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error("amount is required and must be a positive integer");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function validateCurrency(currency) {
  const normalized = (currency ?? "usd").toString().trim().toLowerCase();

  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new Error("currency must be a valid three-letter ISO currency code");
  }

  return normalized;
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new Error("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!key || key.length > 40) {
        throw new Error("metadata keys must be between 1 and 40 characters");
      }

      if (value === null || typeof value === "object") {
        throw new Error("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

export async function createPaymentIntent(payload) {
  const amount = validateAmount(payload?.amount);
  const currency = validateCurrency(payload?.currency);
  const metadata = validateMetadata(payload?.metadata);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe") || error?.rawType?.startsWith("Stripe")) {
      throw error;
    }

    throw error;
  }
}

export async function smokeTestPaymentIntent() {
  if (process.env.STRIPE_PAYMENT_SMOKE_TEST !== "true") {
    return { skipped: true, reason: "STRIPE_PAYMENT_SMOKE_TEST is not true" };
  }

  return {
    skipped: false,
    paymentIntent: await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smokeTest: "true" }
    })
  };
}
