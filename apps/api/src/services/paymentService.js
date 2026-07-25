import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount !== "number" || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error("amount is required and must be a positive integer (in cents)");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency || "usd",
      metadata: payload.metadata || {},
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  } catch (err) {
    if (err.type === "StripeCardError") {
      throw new Error(`Card declined: ${err.message}`);
    }
    if (err.type === "StripeInvalidRequestError") {
      throw new Error(`Invalid request: ${err.message}`);
    }
    throw new Error(`Stripe error: ${err.message}`);
  }
}
