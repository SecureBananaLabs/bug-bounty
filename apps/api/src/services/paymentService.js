import Stripe from "stripe";

// Initialize Stripe client from environment variable
// No hardcoded keys — STRIPE_SECRET_KEY must be set
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Validate payment payload before calling Stripe.
 * @param {object} payload
 * @throws {Error} if payload is invalid
 */
function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payment payload is required");
  }

  const { amount } = payload;

  if (amount === undefined || amount === null) {
    throw new Error("amount is required");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "amount must be a positive integer in the smallest currency unit (e.g. cents)"
    );
  }
}

/**
 * Create a Stripe PaymentIntent and return client_secret + paymentId.
 *
 * @param {object} payload
 * @param {number} payload.amount - Amount in smallest currency unit (cents)
 * @param {string} [payload.currency="usd"] - Three-letter ISO currency code
 * @param {object} [payload.metadata] - Optional metadata for the PaymentIntent
 * @returns {Promise<{paymentId: string, amount: number, currency: string, clientSecret: string, provider: string}>}
 */
export async function createPaymentIntent(payload) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY environment variable."
    );
  }

  validatePayload(payload);

  const amount = payload.amount;
  const currency = (payload.currency ?? "usd").toLowerCase();
  const metadata = payload.metadata ?? {};

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });

    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
      provider: "stripe",
    };
  } catch (err) {
    // Re-throw Stripe errors with original message preserved
    if (
      err.type?.startsWith("Stripe") ||
      err.name?.startsWith("Stripe")
    ) {
      throw new Error(`Stripe error: ${err.message}`);
    }
    throw err;
  }
}
