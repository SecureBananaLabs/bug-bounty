import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

export async function createPaymentIntent(payload) {
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new Error('Invalid amount: Must be a positive integer.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency ?? 'usd',
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: payload.currency ?? 'usd',
      provider: 'stripe'
    };
  } catch (error) {
    throw new Error(`Stripe API error: ${error.message}`);
  }
}
