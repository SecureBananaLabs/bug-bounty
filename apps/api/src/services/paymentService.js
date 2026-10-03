import Stripe from 'stripe';

export async function createPaymentIntent(payload) {
  if (!payload || payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }

  const amount = payload.amount;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }

  const currency = payload.currency || 'usd';

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe'
    };
  } catch (error) {
    throw error;
  }
}
