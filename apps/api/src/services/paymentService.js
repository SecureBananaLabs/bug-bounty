import Stripe from "stripe";

/**
 * Lazily initialise the Stripe client so the module can be imported in tests
 * without requiring STRIPE_SECRET_KEY to be set at import time.
 */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {{ amount: number, currency?: string, metadata?: Record<string,string> }} payload
 * @returns {{ paymentId: string, clientSecret: string, amount: number, currency: string }}
 */
export async function createPaymentIntent(payload) {
  // Validate amount — must be a positive integer (smallest currency unit, e.g. cents)
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error("amount is required");
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const currency = payload.currency ?? "usd";

  const params = {
    amount: payload.amount,
    currency,
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
  };

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create(params);
    return {
      paymentId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
    };
  } catch (err) {
    // Re-throw Stripe errors with the original message preserved
    if (err instanceof Stripe.errors.StripeError) {
      const wrapped = new Error(err.message);
      wrapped.type = err.type;
      wrapped.code = err.code;
      throw wrapped;
    }
    throw err;
  }
}
