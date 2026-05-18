import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey);

/**
 * Creates a Stripe PaymentIntent.
 *
 * @param {object} payload
 * @param {number} payload.amount  - Amount in the smallest currency unit (e.g. cents). Required, must be a positive integer.
 * @param {string} [payload.currency] - ISO 4217 currency code. Defaults to "usd".
 * @param {object} [payload.metadata] - Optional metadata attached to the PaymentIntent.
 * @returns {Promise<{clientSecret: string, paymentId: string, amount: number, currency: string}>}
 * @throws {PaymentError} On validation failure or Stripe API error.
 */
export async function createPaymentIntent(payload) {
  // ── Validation ────────────────────────────────────────────────────
  if (payload.amount === undefined || payload.amount === null) {
    throw new PaymentError(
      "amount is required and must be a positive integer (in cents).",
    );
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentError(
      "amount must be a positive integer representing the smallest currency unit (e.g. cents).",
    );
  }

  const currency = (payload.currency ?? "usd").toLowerCase().trim();

  // ── Stripe API call ───────────────────────────────────────────────
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata ?? {},
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (err) {
    // Preserve original Stripe error details
    if (err.type && typeof err.type === "string" && err.type.startsWith("Stripe")) {
      throw new PaymentError(
        `Stripe error (${err.type}): ${err.message}`,
        err,
      );
    }
    // Re-throw unexpected errors as-is
    throw err;
  }
}

// ── Custom error class ──────────────────────────────────────────────

export class PaymentError extends Error {
  /**
   * @param {string} message    - Human-readable error message.
   * @param {Error}  [original] - Original error (e.g. a Stripe error) for debugging.
   */
  constructor(message, original) {
    super(message);
    this.name = "PaymentError";
    if (original) {
      this.originalError = original;
      this.stripeCode = original.code ?? null;
      this.stripeType = original.type ?? null;
      this.stripeStatusCode = original.statusCode ?? null;
    }
  }
}
