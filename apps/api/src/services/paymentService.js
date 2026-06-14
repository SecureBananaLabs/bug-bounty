import Stripe from "stripe";
import { env } from "../config/env.js";

/** @type {Stripe | null} */
let stripeClient = null;

/**
 * Lazy-initialise the Stripe SDK client.
 * Returns null (with a logged warning) when STRIPE_SECRET_KEY is unset,
 * so callers can fall back gracefully or surface a clear error.
 */
function getStripe() {
  if (stripeClient) return stripeClient;
  if (!env.stripeSecretKey) {
    console.warn(
      "STRIPE_SECRET_KEY is not set — Stripe operations will fail."
    );
    return null;
  }
  stripeClient = new Stripe(env.stripeSecretKey, {
    apiVersion: "2025-03-31.basil", // latest stable as of May 2026
  });
  return stripeClient;
}

/**
 * Validation error thrown when the payment payload is malformed.
 */
export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

/**
 * Generic payment-provider error that wraps upstream Stripe failures.
 */
export class PaymentProviderError extends Error {
  constructor(message, stripeType) {
    super(message);
    this.name = "PaymentProviderError";
    this.statusCode = 502;
    this.stripeType = stripeType ?? "StripeError";
  }
}

/**
 * Validate the payment-intent payload before calling Stripe.
 *
 * @param {object} payload
 * @param {number} payload.amount  – required, positive integer (smallest currency unit, e.g. cents)
 * @param {string} [payload.currency] – ISO 4217 three-letter code, defaults to "usd"
 * @param {Record<string,string>} [payload.metadata] – optional metadata (string values only)
 */
function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new PaymentValidationError(
      "Request body must be a JSON object with at least an `amount` field."
    );
  }

  if (payload.amount === undefined || payload.amount === null) {
    throw new PaymentValidationError(
      "Missing required field `amount`. Must be a positive integer in the smallest currency unit (e.g. cents)."
    );
  }

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError(
      `Invalid amount: ${payload.amount}. Must be a positive integer in the smallest currency unit (e.g. 1099 for $10.99).`
    );
  }

  // Default currency handled after validation
  const currency =
    typeof payload.currency === "string" && payload.currency.length === 3
      ? payload.currency.toLowerCase()
      : "usd";

  // Validate metadata if provided
  if (payload.metadata !== undefined) {
    if (
      typeof payload.metadata !== "object" ||
      Array.isArray(payload.metadata)
    ) {
      throw new PaymentValidationError(
        "`metadata` must be a flat object with string values."
      );
    }
    for (const [key, value] of Object.entries(payload.metadata)) {
      if (typeof value !== "string") {
        throw new PaymentValidationError(
          `metadata.${key} must be a string, got ${typeof value}.`
        );
      }
      if (key.length > 40) {
        throw new PaymentValidationError(
          `metadata key "${key}" exceeds 40 characters.`
        );
      }
      if (value.length > 500) {
        throw new PaymentValidationError(
          `metadata.${key} value exceeds 500 characters.`
        );
      }
    }
  }

  return { amount, currency, metadata: payload.metadata };
}

/**
 * Create a Stripe PaymentIntent and return a normalised response.
 *
 * @param {object} payload
 * @param {number} payload.amount  – required, positive integer (cents)
 * @param {string} [payload.currency] – three-letter ISO code, default "usd"
 * @param {Record<string,string>} [payload.metadata] – optional key-value pairs
 * @returns {Promise<{paymentId: string, clientSecret: string, amount: number, currency: string}>}
 */
export async function createPaymentIntent(payload) {
  const { amount, currency, metadata } = validatePayload(payload);

  const stripe = getStripe();
  if (!stripe) {
    throw new PaymentProviderError(
      "STRIPE_SECRET_KEY is not configured on the server."
    );
  }

  try {
    const params = { amount, currency };
    if (metadata && Object.keys(metadata).length > 0) {
      params.metadata = metadata;
    }

    const paymentIntent = await stripe.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    // Preserve the original Stripe error message and type
    if (error.type && error.type.startsWith("Stripe")) {
      throw new PaymentProviderError(error.message, error.type);
    }
    // Re-throw unknown errors as-is (should not happen, but safe)
    throw error;
  }
}
