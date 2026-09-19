import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;

function getStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  if (!stripe) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
    });
  }
  return stripe;
}

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {Object} payload
 * @param {number} payload.amount - Positive integer in smallest currency unit (e.g., cents for USD)
 * @param {string} [payload.currency="usd"] - Three-letter ISO currency code
 * @param {Object} [payload.metadata] - Optional metadata to attach to the PaymentIntent
 * @returns {Promise<{clientSecret: string, paymentId: string, amount: number, currency: string}>}
 * @throws {Error} If amount is missing, invalid, or Stripe API call fails
 */
export async function createPaymentIntent(payload) {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error("amount is required and must be a positive integer");
  }
  const amount = Number(payload.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g., cents)");
  }

  const currency = payload.currency || "usd";

  try {
    const stripeClient = getStripe();

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      metadata: payload.metadata || {},
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount,
      currency,
    };
  } catch (err) {
    // Preserve Stripe error messages
    if (err.type && err.type.startsWith("Stripe")) {
      throw new Error(err.message);
    }
    throw err;
  }
}
