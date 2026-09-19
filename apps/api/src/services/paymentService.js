import Stripe from "stripe";
import { env } from "../config/env.js";

function createServiceError(message, statusCode, cause) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function normalizeAmount(amount) {
  if (amount === undefined || amount === null) {
    throw createServiceError("Payment amount is required.", 400);
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw createServiceError(
      "Payment amount must be a positive integer in the smallest currency unit.",
      400
    );
  }

  return amount;
}

function normalizeCurrency(currency) {
  const normalized = (currency ?? "usd").toLowerCase();

  if (!/^[a-z]{3}$/.test(normalized)) {
    throw createServiceError(
      "Payment currency must be a valid 3-letter ISO currency code.",
      400
    );
  }

  return normalized;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw createServiceError("Payment metadata must be an object when provided.", 400);
  }

  const normalized = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw createServiceError(
        `Payment metadata field "${key}" must be a string, number, or boolean.`,
        400
      );
    }

    normalized[key] = String(value);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function createStripeClient(secretKey = env.stripeSecretKey) {
  if (!secretKey) {
    throw createServiceError(
      "STRIPE_SECRET_KEY is required to create a PaymentIntent.",
      500
    );
  }

  return new Stripe(secretKey);
}

function isStripeError(error) {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    "type" in error &&
    typeof error.type === "string" &&
    error.type.startsWith("Stripe")
  );
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const stripeClient =
    options.stripeClient ?? createStripeClient(options.stripeSecretKey);

  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    if (!paymentIntent.client_secret) {
      throw createServiceError(
        "Stripe did not return a client secret for the PaymentIntent.",
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
    if (isStripeError(error)) {
      throw createServiceError(error.message, 502, error);
    }

    throw error;
  }
}
