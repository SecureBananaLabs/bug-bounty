import Stripe from "stripe";
import { env } from "../config/env.js";

const DEFAULT_CURRENCY = "usd";

let stripeClient;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

export class PaymentProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return DEFAULT_CURRENCY;
  }

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentValidationError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object") {
        throw new PaymentValidationError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

export function buildPaymentIntentParams(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentValidationError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("amount is required and must be a positive integer");
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

export function createStripeClient(secretKey = env.stripeSecretKey) {
  if (!secretKey) {
    throw new PaymentProviderError("STRIPE_SECRET_KEY is required to create payment intents");
  }

  return new Stripe(secretKey);
}

function getStripeClient() {
  stripeClient ??= createStripeClient();
  return stripeClient;
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
    if (error instanceof PaymentValidationError || error instanceof PaymentProviderError) {
      throw error;
    }

    const message = error?.message ?? "Stripe payment intent creation failed";
    throw new PaymentProviderError(`Stripe payment intent creation failed: ${message}`);
  }
}
