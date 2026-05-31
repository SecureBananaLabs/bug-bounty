import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

export class PaymentConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentConfigurationError";
    this.statusCode = 500;
  }
}

export class PaymentProviderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = cause?.type ?? "StripeError";
    this.statusCode = 502;
    this.cause = cause;
  }
}

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentConfigurationError(
      "STRIPE_SECRET_KEY is required to create payment intents"
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new PaymentValidationError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentValidationError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError(
      "amount is required and must be a positive integer in the smallest currency unit"
    );
  }

  const currency = payload.currency ?? "usd";

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError(
      "currency must be a three-letter ISO currency code"
    );
  }

  const metadata = normalizeMetadata(payload.metadata);

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    ...(metadata ? { metadata } : {})
  };
}

function isStripeError(error) {
  return Boolean(
    error &&
      typeof error === "object" &&
      typeof error.type === "string" &&
      typeof error.message === "string"
  );
}

export async function createPaymentIntent(payload, client) {
  const paymentIntentPayload = normalizePayload(payload);
  const paymentClient = client ?? getStripeClient();

  try {
    const paymentIntent = await paymentClient.paymentIntents.create(
      paymentIntentPayload
    );

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntentPayload.amount,
      currency: paymentIntentPayload.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (isStripeError(error)) {
      throw new PaymentProviderError(error.message, error);
    }

    throw error;
  }
}
