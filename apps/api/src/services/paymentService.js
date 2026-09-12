import Stripe from "stripe";

/**
 * Lazily create a Stripe client so missing STRIPE_SECRET_KEY fails clearly
 * at call-time rather than at module-load.
 */
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new PaymentError("STRIPE_SECRET_KEY environment variable is required", 500);
    }
    _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return _stripe;
}

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {{ amount?: number, currency?: string, metadata?: object }} payload
 * @param {{ stripe?: Stripe }} [deps] - Optional dependency injection for testing
 * @returns {Promise<{ paymentId: string, clientSecret: string, amount: number, currency: string }>}
 */
export async function createPaymentIntent(payload, deps = {}) {
  // --- Input validation ---
  if (payload.amount == null) {
    throw new PaymentError("amount is required", 400);
  }

  if (typeof payload.amount !== "number" || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentError("amount must be a positive integer (smallest currency unit, e.g. cents)", 400);
  }

  const currency = (payload.currency ?? "usd").toLowerCase();

  if (!/^[a-z]{3}$/.test(currency)) {
    throw new PaymentError("currency must be a 3-letter ISO code", 400);
  }

  const stripe = deps.stripe ?? getStripe();

  // --- Create PaymentIntent via Stripe SDK ---
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency,
    metadata: payload.metadata ?? {},
    automatic_payment_methods: { enabled: true },
  });

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
}

/**
 * Custom error class for payment validation failures.
 */
export class PaymentError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentError";
    this.statusCode = statusCode;
  }
}

/**
 * Map Stripe SDK errors to PaymentError.
 * Preserves the original Stripe error message.
 */
export function mapStripeError(err) {
  if (err instanceof PaymentError) {
    return err;
  }

  // StripeError subclasses
  if (err.type === "StripeCardError") {
    return new PaymentError(err.message, 402);
  }
  if (err.type === "StripeInvalidRequestError") {
    return new PaymentError(err.message, 400);
  }
  if (err.type === "StripeAuthenticationError") {
    return new PaymentError(err.message, 401);
  }
  if (err.type === "StripeRateLimitError") {
    return new PaymentError(err.message, 429);
  }
  // Generic Stripe or unknown errors
  return new PaymentError(err.message || "Payment processing failed", 500);
}

/**
 * Reset the cached Stripe client (for testing).
 */
export function _resetStripe() {
  _stripe = null;
}
