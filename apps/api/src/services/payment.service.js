import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload is required and must be an object');
  }

  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required and must be a positive integer');
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount is required and must be a positive integer');
  }

  const amount = payload.amount;
  const currency = payload.currency ?? 'usd';

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
  } catch (error) {
    if (
      error.type === 'StripeCardError' ||
      error.type === 'StripeInvalidRequestError' ||
      error.type === 'StripeAPIError' ||
      error.type === 'StripeConnectionError' ||
      error.type === 'StripeAuthenticationError' ||
      error.type === 'StripeRateLimitError' ||
      error.type === 'StripeIdempotencyError'
    ) {
      throw new Error(error.message);
    }
    throw error;
  }

  return {
    paymentId: paymentIntent.id,
    amount,
    currency,
    provider: 'stripe',
    clientSecret: paymentIntent.client_secret,
  };
}