import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

export async function createPaymentIntent(payload) {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not defined in the environment.");
  }

  if (!payload || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("Invalid payload: 'amount' is required and must be a positive integer.");
  }

  const currency = payload.currency || 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: payload.metadata || {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(`Stripe API Error: ${error.message}`);
  }
}
