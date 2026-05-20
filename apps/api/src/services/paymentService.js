import Stripe from "stripe";
import { env } from "../config/env.js";

const DEFAULT_CURRENCY = "usd";

let injectedStripeClient;
let cachedStripeClient;
let cachedStripeSecretKey;

export class PaymentServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.status = status;
    this.expose = true;
  }
}

export function setStripeClientForTests(client) {
  injectedStripeClient = client;
}

export function resetStripeClientForTests() {
  injectedStripeClient = undefined;
  cachedStripeClient = undefined;
  cachedStripeSecretKey = undefined;
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
}

function getStripeClient() {
  if (injectedStripeClient) {
    return injectedStripeClient;
  }

  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new PaymentServiceError("Stripe secret key is not configured", 500);
  }

  if (!cachedStripeClient || cachedStripeSecretKey !== secretKey) {
    cachedStripeClient = new Stripe(secretKey);
    cachedStripeSecretKey = secretKey;
  }

  return cachedStripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "Amount must be a positive integer in the smallest currency unit"
    );
  }

  return amount;
}

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return DEFAULT_CURRENCY;
  }

  if (typeof currency !== "string") {
    throw new PaymentServiceError("Currency must be a three-letter ISO code");
  }

  const normalizedCurrency = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new PaymentServiceError("Currency must be a three-letter ISO code");
  }

  return normalizedCurrency;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("Metadata must be an object");
  }

  const normalizedMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!key || key.length > 40 || key.includes("[") || key.includes("]")) {
      throw new PaymentServiceError(
        "Metadata keys must be non-empty, under 40 characters, and cannot contain brackets"
      );
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new PaymentServiceError(
        "Metadata values must be strings, numbers, or booleans"
      );
    }

    const stringValue = String(value);
    if (stringValue.length > 500) {
      throw new PaymentServiceError(
        "Metadata values must be 500 characters or fewer"
      );
    }

    normalizedMetadata[key] = stringValue;
  }

  return Object.keys(normalizedMetadata).length ? normalizedMetadata : undefined;
}

export async function createPaymentIntent(payload = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const stripe = getStripeClient();

  const paymentIntentPayload = { amount, currency };
  if (metadata) {
    paymentIntentPayload.metadata = metadata;
  }

  try {
    const paymentIntent =
      await stripe.paymentIntents.create(paymentIntentPayload);

    if (!paymentIntent?.id || !paymentIntent?.client_secret) {
      throw new PaymentServiceError(
        "Stripe did not return a usable PaymentIntent",
        502
      );
    }

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(
      error?.message ?? "Stripe payment intent creation failed",
      error?.statusCode ?? 502
    );
  }
}
