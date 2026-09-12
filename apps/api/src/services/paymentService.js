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
    super(message, { cause });
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentConfigurationError(
      "STRIPE_SECRET_KEY is required to create payment intents"
    );
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentValidationError("metadata must be an object if provided");
  }

  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (!key.trim()) {
        throw new PaymentValidationError("metadata keys must not be empty");
      }

      return [key, String(value)];
    });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function buildPaymentIntentParams(payload = {}) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    throw new PaymentValidationError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError(
      "amount is required and must be a positive integer in the smallest currency unit"
    );
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency.trim())) {
    throw new PaymentValidationError(
      "currency must be a three-letter ISO currency code"
    );
  }

  const metadata = normalizeMetadata(payload.metadata);

  return {
    amount: payload.amount,
    currency: currency.trim().toLowerCase(),
    ...(metadata ? { metadata } : {})
  };
}

function wrapStripeError(error) {
  if (error?.type?.startsWith("Stripe")) {
    throw new PaymentProviderError(error.message, error);
  }

  throw error;
}

export async function createPaymentIntent(payload, options = {}) {
  const params = buildPaymentIntentParams(payload);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? params.amount,
      currency: paymentIntent.currency ?? params.currency,
      provider: "stripe"
    };
  } catch (error) {
    wrapStripeError(error);
  }
}
