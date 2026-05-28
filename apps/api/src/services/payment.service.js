import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload is required and must be an object');
  }

  const { amount, currency, ...metadata } = payload;

  if (amount === undefined || amount === null) {
    throw new Error('amount is required');
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }

  const resolvedCurrency = currency ?? 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: resolvedCurrency,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
      provider: 'stripe',
    };
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      const err = new Error(error.message);
      err.type = error.type;
      err.code = error.code;
      err.decline_code = error.decline_code;
      err.stripeStatusCode = error.statusCode;
      throw err;
    }
    throw error;
  }
}