import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key");

export async function createPaymentIntent(payload) {
  if (!payload || payload.amount === undefined || payload.amount === null) {
    throw new Error("Amount is required");
  }

  const amount = Number(payload.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  const currency = payload.currency || "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    throw new Error(error.message || "Stripe payment error");
  }
}
