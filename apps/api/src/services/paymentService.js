import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  // Validate amount
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('payload.amount is required and must be a positive integer (smallest currency unit, e.g. cents)');
  }

  // Validate and default currency
  const currency = payload.currency ?? 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: payload.metadata ?? {},
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
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}
