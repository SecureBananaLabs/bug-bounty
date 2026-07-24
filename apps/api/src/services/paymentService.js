import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16",
});

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error("Invalid amount: must be a positive integer.");
  }

  const currency = payload.currency || "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      paymentId: paymentIntent.id,
      amount: payload.amount,
      currency: currency,
      provider: "stripe",
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    // Preserve the original Stripe error message
    throw error;
  }
}
