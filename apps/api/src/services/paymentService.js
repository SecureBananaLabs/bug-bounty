import Stripe from "stripe";

/**
 * Validated parameters for creating a PaymentIntent.
 * @typedef {Object} PaymentPayload
 * @property {number} amount - Amount in smallest currency unit (e.g. cents). Required, must be positive integer.
 * @property {string} [currency] - ISO currency code. Defaults to "usd".
 * @property {Object} [metadata] - Optional metadata for the PaymentIntent.
 */

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {PaymentPayload} payload
 * @param {Stripe} [stripe] - Optional pre-configured Stripe client. If omitted, one is created from STRIPE_SECRET_KEY.
 * @returns {Promise<{clientSecret: string, paymentId: string}>}
 * @throws {Error} with a descriptive message on validation failure or Stripe API error.
 */
export async function createPaymentIntent(payload, stripe) {
  // ── Validation ──────────────────────────────────────────────────
  if (!payload || typeof payload !== "object") {
    throw new TypeError("payload is required and must be an object");
  }

  const amount = payload.amount;

  if (amount === undefined || amount === null) {
    throw new Error("amount is required");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const currency = (payload.currency || "usd").toLowerCase();

  if (typeof currency !== "string" || currency.length < 2) {
    throw new Error("currency must be a valid ISO currency code");
  }

  // ── Stripe client initialisation ────────────────────────────────
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set — initialise stripe with a valid secret key");
    }
    stripe = new Stripe(stripeKey);
  }

  // ── Create the PaymentIntent ────────────────────────────────────
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: payload.metadata ?? {},
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (err) {
    // ── Error handling ────────────────────────────────────────────
    // Stripes errors have a .type and .statusCode; we preserve the message
    // so callers get meaningful feedback, and rethrow.
    const message = err.message || "Stripe payment failed";
    const stripeError = new Error(message);
    stripeError.originalError = err;
    stripeError.stripeCode = err.code ?? null;
    stripeError.stripeType = err.type ?? null;
    throw stripeError;
  }
}
