import Stripe from "stripe";
import { env } from "../config/env.js";

let injectedStripeClient;

export function setStripeClientForTests(client) {
  injectedStripeClient = client;
}

export function resetStripeClientForTests() {
  injectedStripeClient = undefined;
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
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
    if (isStripeError(error)) {
      throw new Error(error.message);
    }

    throw error;
  }
}

function getStripeClient() {
  if (injectedStripeClient) {
    return injectedStripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent");
  }

  return new Stripe(env.stripeSecretKey);
}

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error("payload.amount is required and must be a positive integer in the smallest currency unit");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("payload.amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function validateCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("payload.currency must be a three-letter currency code");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("payload.metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new Error(`payload.metadata.${key} must be a string, number, or boolean`);
      }

      return [key, String(value)];
    })
  );
}

function isStripeError(error) {
  return Boolean(error?.type?.startsWith?.("Stripe") || error?.raw?.type || error?.rawType);
}
