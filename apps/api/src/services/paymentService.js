import Stripe from "stripe";
import { env } from "../config/env.js";

const STRIPE_API_VERSION = "2024-06-20";

let stripeClientOverride;
let cachedStripeClient;
let cachedStripeSecretKey;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, cause) {
    super(message, { cause });
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.expose = true;
  }
}

export function setStripeClientForTests(stripeClient) {
  stripeClientOverride = stripeClient;
  cachedStripeClient = undefined;
  cachedStripeSecretKey = undefined;
}

export function clearStripeClientForTests() {
  stripeClientOverride = undefined;
  cachedStripeClient = undefined;
  cachedStripeSecretKey = undefined;
}

function getStripeClient() {
  if (stripeClientOverride) {
    return stripeClientOverride;
  }

  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create Stripe payments", 500);
  }

  if (!cachedStripeClient || cachedStripeSecretKey !== env.stripeSecretKey) {
    cachedStripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION
    });
    cachedStripeSecretKey = env.stripeSecretKey;
  }

  return cachedStripeClient;
}

function normalizeCurrency(currency) {
  if (currency !== undefined && typeof currency !== "string") {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  const normalizedCurrency = (currency ?? "usd").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return normalizedCurrency;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object") {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentServiceError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError("amount must be a positive integer in the smallest currency unit");
  }

  const normalizedPayload = {
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    metadata: normalizeMetadata(payload.metadata)
  };

  if (payload.idempotencyKey !== undefined) {
    if (typeof payload.idempotencyKey !== "string" || !payload.idempotencyKey.trim()) {
      throw new PaymentServiceError("idempotencyKey must be a non-empty string when provided");
    }

    normalizedPayload.idempotencyKey = payload.idempotencyKey.trim();
  }

  return normalizedPayload;
}

function wrapStripeError(error) {
  const statusCode = Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : 502;
  const message = error?.message ?? "Stripe payment request failed";
  return new PaymentServiceError(message, statusCode, error);
}

export async function createPaymentIntent(payload) {
  const validatedPayload = validatePayload(payload);
  const stripeClient = getStripeClient();
  const paymentIntentParams = {
    amount: validatedPayload.amount,
    currency: validatedPayload.currency,
    automatic_payment_methods: {
      enabled: true
    }
  };

  if (validatedPayload.metadata) {
    paymentIntentParams.metadata = validatedPayload.metadata;
  }

  const requestOptions = validatedPayload.idempotencyKey
    ? { idempotencyKey: validatedPayload.idempotencyKey }
    : undefined;

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentParams, requestOptions);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe"
    };
  } catch (error) {
    throw wrapStripeError(error);
  }
}
