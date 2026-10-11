import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil",
});

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {object} payload
 * @param {number} payload.amount   - Amount in smallest currency unit (e.g. cents)
 * @param {string} [payload.currency="usd"] - ISO 4217 currency code
 * @param {object} [payload.metadata] - Optional metadata attached to the PaymentIntent
 * @returns {Promise<{paymentId: string, clientSecret: string}>}
 */
export async function createPaymentIntent(payload) {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error("Missing required field: amount");
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const currency = payload.currency ?? "usd";
  const params = {
    amount: payload.amount,
    currency,
  };

  if (payload.metadata && typeof payload.metadata === "object") {
    params.metadata = payload.metadata;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (err) {
    // Preserve original Stripe error message
    throw new Error(err.message ?? "Stripe API error");
  }
}
