import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

class PaymentError extends Error {
  constructor(message, statusCode, expose = false, cause) {
    super(message, cause ? { cause } : undefined);
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

export class PaymentValidationError extends PaymentError {
  constructor(message) {
    super(message, 400, true);
    this.name = "PaymentValidationError";
  }
}

export class PaymentConfigurationError extends PaymentError {
  constructor() {
    super("Payment provider is not configured", 503, true);
    this.name = "PaymentConfigurationError";
  }
}

export class PaymentProviderError extends PaymentError {
  constructor(message, statusCode = 502, cause) {
    super("Stripe payment failed: " + message, statusCode, true, cause);
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
    throw new PaymentConfigurationError();
  }

  stripeClient = new Stripe(env.stripeSecretKey, {
    maxNetworkRetries: 2
  });
  return stripeClient;
}

function assertPlainObject(value, message) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PaymentValidationError(message);
  }
}

function normalizeCurrency(currency) {
  const value = currency ?? "usd";

  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value.trim())) {
    throw new PaymentValidationError("Payment currency must be a three-letter ISO currency code");
  }

  return value.trim().toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  assertPlainObject(metadata, "Payment metadata must be a flat object when provided");

  const entries = Object.entries(metadata);
  if (entries.length > 50) {
    throw new PaymentValidationError("Payment metadata cannot contain more than 50 entries");
  }

  const normalized = entries.map(([key, value]) => {
    const trimmedKey = key.trim();
    if (!trimmedKey || trimmedKey.length > 40 || trimmedKey.includes("[") || trimmedKey.includes("]")) {
      throw new PaymentValidationError(
        "Payment metadata keys must be non-empty strings of 40 characters or fewer without square brackets"
      );
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new PaymentValidationError("Payment metadata values must be strings, numbers, or booleans");
    }

    const stringValue = String(value);
    if (stringValue.length > 500) {
      throw new PaymentValidationError("Payment metadata values must be 500 characters or fewer");
    }

    return [trimmedKey, stringValue];
  });

  return normalized.length === 0 ? undefined : Object.fromEntries(normalized);
}

function normalizeIdempotencyKey(idempotencyKey) {
  if (idempotencyKey === undefined) {
    return undefined;
  }

  if (typeof idempotencyKey !== "string") {
    throw new PaymentValidationError("Payment idempotencyKey must be a string when provided");
  }

  const normalized = idempotencyKey.trim();
  if (!normalized || normalized.length > 255) {
    throw new PaymentValidationError("Payment idempotencyKey must be between 1 and 255 characters");
  }

  return normalized;
}

export function normalizePaymentPayload(payload = {}) {
  assertPlainObject(payload, "Payment payload must be an object");

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("Payment amount must be a positive integer in the smallest currency unit");
  }

  return {
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    metadata: normalizeMetadata(payload.metadata),
    idempotencyKey: normalizeIdempotencyKey(payload.idempotencyKey)
  };
}

export function buildPaymentIntentRequest(payload) {
  const { amount, currency, metadata, idempotencyKey } = normalizePaymentPayload(payload);
  const params = {
    amount,
    currency,
    ...(metadata === undefined ? {} : { metadata })
  };
  const requestOptions = idempotencyKey === undefined ? undefined : { idempotencyKey };

  return { params, requestOptions };
}

function toPaymentProviderError(error) {
  const message = error instanceof Error ? error.message : "Unknown Stripe error";
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 502;
  return new PaymentProviderError(message, statusCode, error);
}

export async function createPaymentIntent(payload, options = {}) {
  const { params, requestOptions } = buildPaymentIntentRequest(payload);
  const client = options.stripeClient ?? getStripeClient();

  let paymentIntent;
  try {
    paymentIntent = await client.paymentIntents.create(params, requestOptions);
  } catch (error) {
    throw toPaymentProviderError(error);
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount ?? params.amount,
    currency: paymentIntent.currency ?? params.currency,
    provider: "stripe"
  };
}
