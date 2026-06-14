import Stripe from "stripe";

let _stripe = null;

/**
 * Lazily initialise the Stripe client from STRIPE_SECRET_KEY.
 * Allows tests to inject a mocked instance before the real env is set.
 */
export function getStripe(secretKey = process.env.STRIPE_SECRET_KEY) {
  if (!_stripe) {
    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY environment variable is not set. " +
          "Add it to your .env file (see .env.example)."
      );
    }
    _stripe = new Stripe(secretKey, { apiVersion: "2025-04-30.basil" });
  }
  return _stripe;
}

/**
 * Reset the Stripe singleton — used by tests to inject a mock.
 * @param {object|null} instance — Stripe instance or null to clear
 */
export function _resetStripe(instance = null) {
  _stripe = instance;
}

/**
 * Validate and create a Stripe PaymentIntent.
 *
 * @param {{ amount: number, currency?: string }} payload
 * @param {object} [overrides] — test hook: pass { stripe: MockStripe }
 * @returns {{ paymentId: string, clientSecret: string, amount: number, currency: string, provider: string }}
 * @throws {Error} if amount is missing, not a positive integer, or Stripe API fails
 */
export async function createPaymentIntent(payload, overrides = {}) {
  const { amount } = payload;

  // ── Validation ────────────────────────────────────────────────────────────
  if (amount === undefined || amount === null) {
    throw new Error("payload.amount is required");
  }
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "payload.amount must be a positive integer (smallest currency unit, e.g. cents)"
    );
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || currency.length === 0) {
    throw new Error("payload.currency must be a non-empty string");
  }

  // ── Stripe call ───────────────────────────────────────────────────────────
  const stripe = overrides.stripe ?? getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (err) {
    // Re-throw Stripe errors with their original message so callers can surface it
    if (err.type && err.type.startsWith("Stripe")) {
      const msg = err.message ?? "Stripe error";
      throw new Error(msg);
    }
    throw err;
  }
}
