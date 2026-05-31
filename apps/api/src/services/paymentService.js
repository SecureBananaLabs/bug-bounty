/**
 * Payment Service
 *
 * Handles Stripe PaymentIntent creation and related payment operations.
 * Requires STRIPE_SECRET_KEY environment variable.
 */

// Stripe SDK — must be added to package.json dependencies
// npm install stripe
let stripe = null;

function getStripe() {
  if (!stripe) {
    const Stripe = require("stripe");
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Set it in your environment " +
        "or .env file to enable real payment processing."
      );
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia", // latest stable
      timeout: 10000,
    });
  }
  return stripe;
}

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {Object} payload
 * @param {number} payload.amount        - Amount in smallest currency unit (cents for USD)
 * @param {string} [payload.currency]    - ISO 4217 currency code (default: "usd")
 * @param {Object} [payload.metadata]    - Optional metadata key-value pairs
 * @param {string} [payload.description] - Optional description for the payment
 * @param {string} [payload.customerId]  - Optional Stripe customer ID
 *
 * @returns {Promise<{paymentId: string, clientSecret: string, amount: number, currency: string, provider: string}>}
 *
 * @throws {Error} On invalid input, Stripe API errors, or missing API key.
 */
export async function createPaymentIntent(payload) {
  // ── Validate input ────────────────────────────────────────────────
  if (!payload || typeof payload.amount !== "number" || payload.amount <= 0) {
    const error = new Error("Invalid payment amount. Amount must be a positive number (in cents).");
    error.status = 400;
    error.code = "INVALID_AMOUNT";
    throw error;
  }

  if (payload.amount < 50) {
    // Stripe minimum charge is $0.50 USD
    const error = new Error("Amount too low. Minimum charge is $0.50 (50 cents).");
    error.status = 400;
    error.code = "AMOUNT_TOO_LOW";
    throw error;
  }

  if (payload.amount > 99999999) {
    // Stripe max is 999999.99 USD
    const error = new Error("Amount exceeds maximum allowed ($999,999.99).");
    error.status = 400;
    error.code = "AMOUNT_TOO_HIGH";
    throw error;
  }

  const currency = (payload.currency || "usd").toLowerCase();

  // ── Prepare metadata ──────────────────────────────────────────────
  const metadata = {
    ...(payload.metadata || {}),
    source: "freelanceflow",
  };

  // Ensure metadata values are strings (Stripe requirement)
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value !== "string") {
      metadata[key] = String(value);
    }
  }

  // ── Attempt to use Stripe ─────────────────────────────────────────
  try {
    const stripe = getStripe();

    const paymentIntentParams = {
      amount: Math.round(payload.amount), // Stripe expects integer cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    if (payload.description) {
      paymentIntentParams.description = payload.description;
    }

    if (payload.customerId) {
      paymentIntentParams.customer = payload.customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
      status: paymentIntent.status,
    };
  } catch (err) {
    // ── Handle Stripe-specific errors ──────────────────────────────
    if (err.type === "StripeCardError") {
      const error = new Error(`Card declined: ${err.message}`);
      error.status = 402;
      error.code = "CARD_DECLINED";
      error.stripeCode = err.code;
      throw error;
    }

    if (err.type === "StripeInvalidRequestError") {
      const error = new Error(`Invalid payment request: ${err.message}`);
      error.status = 400;
      error.code = "INVALID_REQUEST";
      error.stripeCode = err.code;
      throw error;
    }

    if (err.type === "StripeAuthenticationError") {
      const error = new Error(
        "Payment service authentication failed. Please check STRIPE_SECRET_KEY configuration."
      );
      error.status = 500;
      error.code = "STRIPE_AUTH_ERROR";
      throw error;
    }

    if (err.type === "StripeRateLimitError") {
      const error = new Error("Payment service rate limit exceeded. Please try again later.");
      error.status = 429;
      error.code = "RATE_LIMITED";
      throw error;
    }

    if (err.type === "StripeAPIError" || err.type === "StripeConnectionError") {
      const error = new Error(
        "Payment service temporarily unavailable. Please try again later."
      );
      error.status = 503;
      error.code = "STRIPE_UNAVAILABLE";
      throw error;
    }

    // ── Configuration errors (no Stripe key) ───────────────────────
    if (err.message && err.message.includes("STRIPE_SECRET_KEY")) {
      const error = new Error(err.message);
      error.status = 500;
      error.code = "STRIPE_NOT_CONFIGURED";
      throw error;
    }

    // ── Unknown / unexpected errors ────────────────────────────────
    console.error("[PaymentService] Unexpected error:", err);
    const error = new Error("An unexpected payment error occurred. Please try again.");
    error.status = 500;
    error.code = "UNKNOWN_ERROR";
    throw error;
  }
}

/**
 * Confirm a payment (webhook handler-ready).
 *
 * @param {string} paymentIntentId - Stripe PaymentIntent ID (pi_xxx)
 * @returns {Promise<Object>} Retrieved PaymentIntent
 */
export async function retrievePayment(paymentIntentId) {
  if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
    const error = new Error("Invalid PaymentIntent ID.");
    error.status = 400;
    error.code = "INVALID_PAYMENT_ID";
    throw error;
  }

  try {
    const stripe = getStripe();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    if (err.type === "StripeInvalidRequestError") {
      const error = new Error(`Payment not found: ${paymentIntentId}`);
      error.status = 404;
      error.code = "PAYMENT_NOT_FOUND";
      throw error;
    }
    throw err;
  }
}

/**
 * Cancel a PaymentIntent.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<Object>} Cancelled PaymentIntent
 */
export async function cancelPayment(paymentIntentId) {
  if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
    const error = new Error("Invalid PaymentIntent ID.");
    error.status = 400;
    error.code = "INVALID_PAYMENT_ID";
    throw error;
  }

  try {
    const stripe = getStripe();
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (err) {
    if (err.type === "StripeInvalidRequestError") {
      const error = new Error(`Cannot cancel payment: ${err.message}`);
      error.status = 400;
      error.code = "CANCEL_FAILED";
      throw error;
    }
    throw err;
  }
}
