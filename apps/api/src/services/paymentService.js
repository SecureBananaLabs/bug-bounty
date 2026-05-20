import Stripe from "stripe";
import { env } from "../config/env.js";

let stripe;

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(env.stripeSecretKey);
  }
  return stripe;
}

/**
 * Create a Stripe PaymentIntent for the given payload.
 *
 * @param {object} payload - Request payload
 * @param {number} payload.amount - Amount in smallest currency unit (e.g. cents). Required, must be positive integer.
 * @param {string} [payload.currency] - ISO currency code (default: "usd").
 * @param {object} [stripeClient] - Optional Stripe instance (for testing/mocking).
 * @returns {Promise<{paymentId: string, clientSecret: string, amount: number, currency: string, provider: string}>}
 */
export async function createPaymentIntent(payload, stripeClient) {
  const { amount, currency } = payload ?? {};

  // --- validate amount ---
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "Invalid amount: must be a positive integer in the smallest currency unit (e.g. cents)"
    );
  }

  const resolvedCurrency = currency ?? "usd";
  const client = stripeClient ?? getStripe();

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount,
      currency: resolvedCurrency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (error) {
    if (error.type && error.type.startsWith("Stripe")) {
      // e.g. StripeCardError, StripeInvalidRequestError
      throw new Error(`Stripe error (${error.type}): ${error.message}`);
    }
    throw error;
  }
}
