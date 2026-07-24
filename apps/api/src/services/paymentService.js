import Stripe from "stripe";

// Initialize Stripe client using STRIPE_SECRET_KEY environment variable. 
// Uses a dummy key fallback for tests/non-live environments to prevent constructor throwing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key");

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload || payload.amount === undefined || payload.amount === null) {
    throw new Error("Amount is required");
  }

  const amount = payload.amount;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  // Currency defaults to "usd"
  const currency = payload.currency ?? "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Catch Stripe errors and re-throw preserving the original message
    throw new Error(error.message || "Stripe payment error");
  }
}
