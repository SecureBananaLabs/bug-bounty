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
    this.name = "PaymentProviderError";
    this.statusCode = 502;
    this.cause = cause;
  }
}

export function configureStripeClient(client) {
  stripeClient = client;
}

export function resetStripeClient() {
  stripeClient = undefined;
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
  if (!secretKey) {
    throw new PaymentConfigurationError("STRIPE_SECRET_KEY is required to create payments");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function validateMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!key || typeof key !== "string") {
        throw new PaymentValidationError("metadata keys must be non-empty strings");
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentValidationError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentValidationError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("currency must be a three-letter ISO currency code");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: validateMetadata(payload.metadata)
  };
}

function isStripeError(error) {
  return typeof error?.type === "string" && error.type.startsWith("Stripe");
}

export async function createPaymentIntent(payload) {
  const payment = validatePayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: payment.amount,
      currency: payment.currency,
      ...(payment.metadata ? { metadata: payment.metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentValidationError || error instanceof PaymentConfigurationError) {
      throw error;
    }

    if (isStripeError(error)) {
      throw new PaymentProviderError(`Stripe payment failed: ${error.message}`, error);
    }

    throw error;
  }
}
