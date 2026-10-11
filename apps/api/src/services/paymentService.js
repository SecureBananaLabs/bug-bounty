import Stripe from "stripe";
import { env } from "../config/env.js";

let cachedStripeClient;
let cachedStripeSecretKey;

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return "usd";
  }

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest currency unit");
  }

  return {
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    metadata: normalizeMetadata(payload.metadata)
  };
}

function getStripeClient({ stripeClient, stripeSecretKey = env.stripeSecretKey } = {}) {
  if (stripeClient) {
    return stripeClient;
  }

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a payment intent");
  }

  if (!cachedStripeClient || cachedStripeSecretKey !== stripeSecretKey) {
    cachedStripeClient = new Stripe(stripeSecretKey);
    cachedStripeSecretKey = stripeSecretKey;
  }

  return cachedStripeClient;
}

export async function createPaymentIntent(payload, options = {}) {
  const request = validatePayload(payload);
  const stripeClient = getStripeClient(options);

  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: request.amount,
      currency: request.currency,
      ...(request.metadata ? { metadata: request.metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? request.amount,
      currency: paymentIntent.currency ?? request.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error && typeof error.message === "string" && (error.type || error.rawType)) {
      throw new Error(error.message);
    }

    throw error;
  }
}
