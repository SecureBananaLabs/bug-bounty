import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount !== 'number' || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: amount must be a positive integer.');
  }

  const currency = payload.currency ?? "usd";

  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: currency,
  });

  return {
    paymentId: paymentIntent.id,
    amount: payload.amount,
    currency: currency,
    provider: "stripe",
    clientSecret: paymentIntent.client_secret
  };
}
