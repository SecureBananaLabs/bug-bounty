import Stripe from "stripe";

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {object} payload
 * @param {number} payload.amount - Amount in smallest currency unit (e.g., cents). Required, must be positive.
 * @param {string} [payload.currency] - Currency code (defaults to "usd").
 * @returns {Promise<{clientSecret: string, paymentId: string}>}
 */
export async function createPaymentIntent(payload) {
  // Validate amount — required and must be a positive integer
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error("payload.amount is required");
  }
  if (
    typeof payload.amount !== "number" ||
    !Number.isInteger(payload.amount) ||
    payload.amount <= 0
  ) {
    throw new Error(
      "payload.amount must be a positive integer (smallest currency unit, e.g. cents)"
    );
  }

  const currency = payload.currency ?? "usd";

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
  });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (err) {
    // Re-throw Stripe errors with the original error message preserved
    if (err.type && err.type.startsWith("Stripe")) {
      const message = err.message || "Stripe error";
      throw new Error(message);
    }
    throw err;
  }
}