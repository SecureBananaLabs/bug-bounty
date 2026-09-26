import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
    this.expose = true;
  }
}

export class PaymentConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentConfigurationError";
    this.statusCode = 503;
    this.expose = true;
  }
}

export class PaymentProviderError extends Error {
  constructor(message, statusCode, cause) {
    super(message, { cause });
    this.name = "PaymentProviderError";
    this.statusCode = statusCode;
    this.expose = true;
  }
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    if (isStripeError(error)) {
      throw new PaymentProviderError(
        error.message,
        getStripeErrorStatusCode(error),
        error
      );
    }

    throw error;
  }
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentConfigurationError(
      "STRIPE_SECRET_KEY is required to create payment intents."
    );
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError(
      "payload.amount is required and must be a positive integer in the smallest currency unit."
    );
  }

  return amount;
}

function validateCurrency(currency = "usd") {
  if (typeof currency !== "string") {
    throw new PaymentValidationError(
      "payload.currency must be a three-letter ISO currency code."
    );
  }

  const normalizedCurrency = currency.trim().toLowerCase();

  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new PaymentValidationError(
      "payload.currency must be a three-letter ISO currency code."
    );
  }

  return normalizedCurrency;
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new PaymentValidationError("payload.metadata must be an object.");
  }

  const entries = Object.entries(metadata);

  if (entries.length > 50) {
    throw new PaymentValidationError(
      "payload.metadata cannot contain more than 50 keys."
    );
  }

  return entries.reduce((accumulator, [key, value]) => {
    if (typeof key !== "string" || key.length === 0 || key.length > 40) {
      throw new PaymentValidationError(
        "payload.metadata keys must be 1 to 40 characters long."
      );
    }

    if (key.includes("[") || key.includes("]")) {
      throw new PaymentValidationError(
        "payload.metadata keys cannot contain square brackets."
      );
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new PaymentValidationError(
        "payload.metadata values must be strings, numbers, or booleans."
      );
    }

    const normalizedValue = String(value);

    if (normalizedValue.length > 500) {
      throw new PaymentValidationError(
        "payload.metadata values cannot exceed 500 characters."
      );
    }

    accumulator[key] = normalizedValue;
    return accumulator;
  }, {});
}

function isStripeError(error) {
  return typeof error?.type === "string" && error.type.startsWith("Stripe");
}

function getStripeErrorStatusCode(error) {
  if (error.type === "StripeCardError") {
    return 402;
  }

  if (error.type === "StripeInvalidRequestError") {
    return 400;
  }

  return error.statusCode ?? 502;
}
