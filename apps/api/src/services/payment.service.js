import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload is required and must be an object');
  }

  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required and must be a positive integer');
  }

  const amount = Number(payload.amount);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount is required and must be a positive integer');
  }

  // Validate currency
  const currency = payload.currency ?? 'usd';

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
      const stripeError = new Error(error.message);
      stripeError.name = error.type;
      throw stripeError;
    }
    throw error;
  }
}