import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient = null;
let stripeClientApiKey = null;

/**
 * Resolve the Stripe secret key from the environment. No keys are ever
 * hardcoded; production supplies STRIPE_SECRET_KEY and tests receive a
 * dummy value from the npm test script environment.
 */
function resolveStripeKey() {
  return process.env.STRIPE_SECRET_KEY || env.stripeSecretKey;
}

/**
 * Lazily create (and cache) a Stripe client for the configured secret key.
 * Throws a descriptive error when no key is configured instead of letting
 * the SDK fail with an opaque message.
 */
export function getStripeClient() {
  const secret = resolveStripeKey();

  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured; set the environment variable to create payment intents"
    );
  }

  if (!stripeClient || stripeClientApiKey !== secret) {
    stripeClient = new Stripe(secret);
    stripeClientApiKey = secret;
  }

  return stripeClient;
}

function validatePaymentPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payment payload must be an object");
  }

  const { amount, currency = "usd", metadata } = payload;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "amount is required and must be a positive integer in the smallest currency unit (e.g. cents)"
    );
  }

  if (typeof currency !== "string" || currency.trim().length === 0) {
    throw new Error("currency must be a non-empty string when provided");
  }

  if (
    metadata !== undefined &&
    (metadata === null || typeof metadata !== "object" || Array.isArray(metadata))
  ) {
    throw new Error("metadata must be an object when provided");
  }

  return { amount, currency: currency.toLowerCase(), metadata };
}

export async function createPaymentIntent(payload = {}) {
  const { amount, currency, metadata } = validatePaymentPayload(payload);
  const stripe = getStripeClient();

  const params = { amount, currency };
  if (metadata !== undefined) {
    params.metadata = metadata;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Preserve the original Stripe error (message, type, statusCode) so
    // callers can surface meaningful details to the client.
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Stripe payment intent creation failed: ${String(error)}`);
  }
}
