import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw paymentError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

export async function createPaymentIntent(payload, options = {}) {
  const { amount, currency, metadata } = normalizePaymentPayload(payload);
  const client = options.stripeClient ?? getStripeClient();

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
    throw normalizeStripeError(error);
  }
}

function normalizePaymentPayload(payload = {}) {
  const amount = payload.amount;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw paymentError("Payment amount must be a positive integer in the smallest currency unit");
  }

  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);

  return { amount, currency, metadata };
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw paymentError("Payment currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) return undefined;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw paymentError("Payment metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw paymentError("Payment metadata values must be strings, numbers, or booleans");
      }
      return [key, String(value)];
    })
  );
}

function normalizeStripeError(error) {
  if (error?.type?.startsWith("Stripe") || error?.raw?.message) {
    return paymentError(error.message || error.raw.message, error.statusCode ?? 502);
  }

  return error;
}

function paymentError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}
