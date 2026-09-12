import Stripe from "stripe";
import { env } from "../config/env.js";

const STRIPE_API_VERSION = "2026-02-25.clover";

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

export async function createPaymentIntent(payload, client) {
  const { amount, currency, metadata } = normalizePaymentPayload(payload);
  const stripe = client ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
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
    if (isStripeError(error)) {
      throw new PaymentProviderError(error.message);
    }
    throw error;
  }
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentProviderError("STRIPE_SECRET_KEY is required to create Stripe PaymentIntents");
  }

  stripeClient ??= new Stripe(env.stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION
  });

  return stripeClient;
}

function normalizePaymentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("amount is required and must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("currency must be a three-letter ISO currency code");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: normalizeMetadata(payload.metadata)
  };
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
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

function isStripeError(error) {
  return error?.type?.startsWith?.("Stripe") || error instanceof Stripe.errors.StripeError;
}
