import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

class PaymentError extends Error {
  constructor(message, statusCode, cause) {
    super(message, cause ? { cause } : undefined);
    this.statusCode = statusCode;
    this.expose = true;
  }
}

export class PaymentValidationError extends PaymentError {
  constructor(message) {
    super(message, 400);
    this.name = "PaymentValidationError";
  }
}

export class PaymentConfigurationError extends PaymentError {
  constructor(message) {
    super(message, 500);
    this.name = "PaymentConfigurationError";
  }
}

export class PaymentProviderError extends PaymentError {
  constructor(message, statusCode = 502, cause) {
    super(message, statusCode, cause);
    this.name = "PaymentProviderError";
  }
}

export function setStripeClientForTesting(client) {
  stripeClient = client;
}

export function resetStripeClientForTesting() {
  stripeClient = undefined;
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new PaymentConfigurationError(
      "STRIPE_SECRET_KEY is required to create payment intents"
    );
  }

  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function normalizeCurrency(currency) {
  const value = currency ?? "usd";

  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value.trim())) {
    throw new PaymentValidationError(
      "currency must be a three-letter ISO currency code"
    );
  }

  return value.trim().toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError(
      "metadata must be a flat object when provided"
    );
  }

  const entries = Object.entries(metadata).map(([key, value]) => {
    if (!key.trim()) {
      throw new PaymentValidationError("metadata keys must be non-empty strings");
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new PaymentValidationError(
        "metadata values must be strings, numbers, or booleans"
      );
    }

    return [key, String(value)];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function buildPaymentIntentParams(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentValidationError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError(
      "amount is required and must be a positive integer in the smallest currency unit"
    );
  }

  const params = {
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency)
  };

  const metadata = normalizeMetadata(payload.metadata);
  if (metadata) {
    params.metadata = metadata;
  }

  return params;
}

function normalizeStripeError(error) {
  if (error?.type?.startsWith("Stripe")) {
    return new PaymentProviderError(
      error.message,
      error.statusCode ?? 502,
      error
    );
  }

  return error;
}

export async function createPaymentIntent(payload, options = {}) {
  const params = buildPaymentIntentParams(payload);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw normalizeStripeError(error);
  }
}
