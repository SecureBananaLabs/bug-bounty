import Stripe from "stripe";
import { env } from "../config/env.js";

function validateAmount(payload) {
  if (!Number.isInteger(payload?.amount) || payload.amount <= 0) {
    throw new Error("payload.amount must be a positive integer");
  }
}

function normalizeCurrency(payload) {
  return payload?.currency ?? "usd";
}

function normalizeMetadata(payload) {
  if (payload?.metadata == null) {
    return undefined;
  }

  if (typeof payload.metadata !== "object" || Array.isArray(payload.metadata)) {
    throw new Error("payload.metadata must be an object of string values");
  }

  const metadata = {};
  for (const [key, value] of Object.entries(payload.metadata)) {
    if (typeof value !== "string") {
      throw new Error(`payload.metadata.${key} must be a string`);
    }

    metadata[key] = value;
  }

  return metadata;
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload, stripeClient = getStripeClient()) {
  validateAmount(payload);

  const currency = normalizeCurrency(payload);
  const metadata = normalizeMetadata(payload);
  let paymentIntent;

  try {
    const request = {
      amount: payload.amount,
      currency
    };

    if (metadata) {
      request.metadata = metadata;
    }

    paymentIntent = await stripeClient.paymentIntents.create(request);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Stripe API error");
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
