import Stripe from "stripe";
import { env } from "../config/env.js";

const DEFAULT_CURRENCY = "usd";
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 99999999;
const CURRENCY_PATTERN = /^[a-z]{3}$/;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(env.stripeSecretKey);
}

function normalizeMetadata(metadata = {}) {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => key && value !== undefined && value !== null)
      .map(([key, value]) => [String(key).slice(0, 40), String(value).slice(0, 500)])
  );
}

function validatePaymentPayload(payload = {}) {
  const amount = Number(payload.amount);
  const currency = String(payload.currency ?? DEFAULT_CURRENCY).toLowerCase();

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    throw new Error("Payment amount must be an integer in the smallest currency unit");
  }

  if (!CURRENCY_PATTERN.test(currency)) {
    throw new Error("Currency must be a three-letter ISO currency code");
  }

  return {
    amount,
    currency,
    metadata: normalizeMetadata(payload.metadata),
  };
}

/**
 * Creates a Stripe PaymentIntent.
 * @param {Object} payload - Payment details.
 * @param {number} payload.amount - Amount in smallest currency unit (for example, cents).
 * @param {string} [payload.currency] - ISO currency code, defaults to usd.
 * @param {Object} [payload.metadata] - Optional metadata for Stripe.
 * @returns {Promise<Object>} Safe PaymentIntent response for the client.
 */
export async function createPaymentIntent(payload, stripeClient) {
  const input = validatePaymentPayload(payload);
  const client = stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount: input.amount,
      currency: input.currency,
      metadata: input.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (error) {
    console.error("Stripe PaymentIntent Error:", error.message);
    throw new Error("Failed to create payment intent");
  }
}
