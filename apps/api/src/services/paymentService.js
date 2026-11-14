import Stripe from "stripe";

let _stripe = null;

/**
 * Initialise (or replace) the Stripe singleton.
 * Call once at app startup with the real key.
 *
 * @param {string} [secretKey] - Stripe secret key. Falls back to STRIPE_SECRET_KEY env var.
 * @param {import("stripe").default} [stripeInstance] - Optional pre-configured Stripe instance
 *        (useful for testing without real API calls).
 */
export function initStripe(secretKey, stripeInstance) {
  if (stripeInstance) {
    _stripe = stripeInstance;
    return _stripe;
  }
  const key = secretKey ?? process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return _stripe;
}

function getStripe() {
  if (!_stripe) {
    initStripe();
  }
  return _stripe;
}

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {{ amount: number, currency?: string }} payload
 * @returns {{ paymentId: string, clientSecret: string, amount: number, currency: string, provider: string }}
 */
export async function createPaymentIntent(payload) {
  if (!payload.amount || typeof payload.amount !== "number" || payload.amount <= 0) {
    throw new Error(
      "payload.amount is required and must be a positive integer (smallest currency unit, e.g. cents)"
    );
  }

  const currency = payload.currency ?? "usd";

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: payload.amount,
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
    throw new Error(err.message);
  }
}
