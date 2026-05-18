import Stripe from "stripe";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is required");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export async function createPaymentIntent(payload) {
  const { amount, currency = "usd", metadata = {} } = payload;

  if (amount === undefined || amount === null) {
    throw new Error("amount is required");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const stripe = getStripeClient();

  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });

    return {
      clientSecret: intent.client_secret,
      paymentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      provider: "stripe",
    };
  } catch (err) {
    // Preserve original Stripe error message for all Stripe error types
    throw new Error(err.message ?? "Stripe payment intent creation failed");
  }
}
