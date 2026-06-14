import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('payload.amount is required and must be a positive integer');
  }

  const currency = payload.currency ?? "usd";

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
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    throw error;
  }
}
