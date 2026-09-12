import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error('amount is required and must be a positive integer (smallest currency unit, e.g. cents)');
  }
  const parsed = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('amount must be a positive integer (smallest currency unit, e.g. cents)');
  }
  return parsed;
}

export async function createPaymentIntent(payload) {
  const amount = validateAmount(payload.amount);
  const currency = (payload.currency || 'usd').toLowerCase();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: payload.metadata || {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: 'stripe',
    };
  } catch (error) {
    if (error.type === 'StripeCardError') {
      throw new Error(`Stripe card error: ${error.message}`);
    }
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Stripe invalid request: ${error.message}`);
    }
    if (error.type === 'StripeRateLimitError') {
      throw new Error(`Stripe rate limit exceeded: ${error.message}`);
    }
    if (error.type === 'StripeAPIError') {
      throw new Error(`Stripe API error: ${error.message}`);
    }
    throw error;
  }
}
