import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload is required');
  }

  const { amount, currency = 'usd' } = payload;

  if (amount === undefined || amount === null) {
    throw new Error('amount is required');
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }

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
      provider: 'stripe',
    };
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function createPaymentIntentStub(payload) {
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,