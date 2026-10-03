import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, code = "payment_error") {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError(
      "STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent.",
      500,
      "missing_stripe_secret_key"
    );
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "Payment amount must be a positive integer in the smallest currency unit.",
      400,
      "invalid_amount"
    );
  }

  return amount;
}

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return "usd";
  }

  if (typeof currency !== "string") {
    throw new PaymentServiceError(
      "Payment currency must be a three-letter ISO currency code.",
      400,
      "invalid_currency"
    );
  }

  const normalizedCurrency = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new PaymentServiceError(
      "Payment currency must be a three-letter ISO currency code.",
      400,
      "invalid_currency"
    );
  }

  return normalizedCurrency;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentServiceError(
      "Payment metadata must be an object when provided.",
      400,
      "invalid_metadata"
    );
  }

  const normalizedMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value) || typeof value === "object") {
      throw new PaymentServiceError(
        "Payment metadata values must be strings, numbers, or booleans.",
        400,
        "invalid_metadata"
      );
    }

    normalizedMetadata[key] = String(value);
  }

  return Object.keys(normalizedMetadata).length > 0 ? normalizedMetadata : undefined;
}

function normalizePaymentIntentPayload(payload = {}) {
  if (payload === null || Array.isArray(payload) || typeof payload !== "object") {
    throw new PaymentServiceError(
      "Payment payload must be an object.",
      400,
      "invalid_payload"
    );
  }

  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);

  return {
    amount,
    currency,
    ...(metadata ? { metadata } : {})
  };
}

function toPaymentServiceError(error) {
  if (error instanceof PaymentServiceError) {
    return error;
  }

  const message =
    error && typeof error.message === "string"
      ? error.message
      : "Stripe failed to create the PaymentIntent.";

  return new PaymentServiceError(
    `Stripe payment error: ${message}`,
    502,
    error?.code ?? error?.type ?? "stripe_error"
  );
}

export async function createPaymentIntent(payload, options = {}) {
  const paymentIntentPayload = normalizePaymentIntentPayload(payload);
  const client = options.stripeClient ?? getStripeClient();

  let paymentIntent;
  try {
    paymentIntent = await client.paymentIntents.create(paymentIntentPayload);
  } catch (error) {
    throw toPaymentServiceError(error);
  }

  if (!paymentIntent?.id || !paymentIntent?.client_secret) {
    throw new PaymentServiceError(
      "Stripe returned an incomplete PaymentIntent response.",
      502,
      "incomplete_payment_intent"
    );
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntentPayload.amount,
    currency: paymentIntentPayload.currency,
    provider: "stripe"
  };
}
