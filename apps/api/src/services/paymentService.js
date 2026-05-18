import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Create a Stripe PaymentIntent.
 * @param {Object} payload
 * @param {number} payload.amount - Amount in smallest currency unit (e.g. cents). Required, positive integer.
 * @param {string} [payload.currency="usd"] - ISO currency code. Defaults to "usd".
 * @param {Object} [payload.metadata={}] - Optional Stripe metadata key/value pairs.
 * @returns {Promise<{clientSecret: string, paymentId: string, amount: number, currency: string, provider: string}>}
 */
export async function createPaymentIntent(payload) {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error("payload.amount is required");
  }
  const amount = Number(payload.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      `payload.amount must be a positive integer (smallest currency unit, e.g. cents). Received: ${payload.amount}`
    );
  }

  const currency = payload.currency ?? "usd";
  const metadata = payload.metadata ?? {};

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (err) {
    // Re-throw Stripe errors with original message preserved
    if (err.type && err.type.startsWith("Stripe")) {
      throw new Error(`Stripe error (${err.type}): ${err.message}`);
    }
    throw err;
  }
}
