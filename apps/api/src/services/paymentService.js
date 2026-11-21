import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount is required and must be a positive integer (smallest currency unit, e.g. cents)');
  }

  const currency = payload.currency ?? 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe',
    };
  } catch (error) {
    if (error.name === 'StripeCardError' || error.name === 'StripeInvalidRequestError' || error.name === 'StripeAPIError') {
      throw new Error(error.message);
    }
    throw error;
  }
}