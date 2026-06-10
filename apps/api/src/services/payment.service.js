import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (payload === undefined || payload === null) {
    throw new Error('Payload is required');
  }

  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required and must be a positive integer');
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount is required and must be a positive integer');
  }

  // Set default currency
  const currency = payload.currency ?? 'usd';

  // Validate currency is a string
  if (typeof currency !== 'string' || currency.length === 0) {
    throw new Error('currency must be a non-empty string');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: payload.metadata || {},
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
      throw new Error(error.message);
    }
    throw error;
  }
}

  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };