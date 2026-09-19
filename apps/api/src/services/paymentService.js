import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class PaymentValidationError extends PaymentServiceError {
  constructor(message) {
    super(message, 400);
  }
}

export class PaymentConfigurationError extends PaymentServiceError {
  constructor(message) {
    super(message, 500);
  }
}

export class PaymentProviderError extends PaymentServiceError {
  constructor(message, options = {}) {
    super(message, 502, options);
  }
}

const STRIPE_API_VERSION = "2026-02-25.clover";
let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentConfigurationError("STRIPE_SECRET_KEY is required to create Stripe PaymentIntents");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION
    });
  }

  return stripeClient;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentValidationError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("payload.amount is required and must be a positive integer");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new PaymentValidationError("payload.currency must be a 3-letter currency code");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: validateMetadata(payload.metadata)
  };
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("payload.metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!key) {
        throw new PaymentValidationError("payload.metadata keys must be non-empty strings");
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentValidationError("payload.metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function isStripeError(error) {
  return Boolean(error?.type && error?.message);
}

export async function createPaymentIntent(payload, options = {}) {
  const validatedPayload = validatePayload(payload);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create(
      Object.fromEntries(
        Object.entries({
          amount: validatedPayload.amount,
          currency: validatedPayload.currency,
          metadata: validatedPayload.metadata
        }).filter(([, value]) => value !== undefined)
      )
    );

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (isStripeError(error)) {
      throw new PaymentProviderError(error.message, { cause: error });
    }

    throw error;
  }
}
