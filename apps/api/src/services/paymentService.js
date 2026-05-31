import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Create a Stripe PaymentIntent and return the client secret.
 * @param {{ amount: number, currency?: string, metadata?: Record<string, string> }} payload
 */
export async function createPaymentIntent(payload) {
  if (!payload.amount || payload.amount <= 0) {
    throw new Error("Invalid amount: must be a positive number.");
  }

  const { amount, currency = "usd", metadata = {} } = payload;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit (cents)
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        platform: "freelanceflow",
        ...metadata,
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Failed to create payment intent.";
    throw new Error(message);
  }
}

/**
 * Retrieve a PaymentIntent by its ID.
 * @param {string} paymentId
 */
export async function retrievePaymentIntent(paymentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      provider: "stripe",
    };
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Failed to retrieve payment intent.";
    throw new Error(message);
  }
}
