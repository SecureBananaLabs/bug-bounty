import Stripe from 'stripe';

let stripe = null;

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export async function createPaymentIntent(payload) {
  // Validate amount: required, must be a positive integer (smallest currency unit)
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required');
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount must be a positive integer (smallest currency unit, e.g. cents)');
  }

  const currency = payload.currency ?? 'usd';

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: payload.amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency,
      provider: 'stripe',
    };
  } catch (error) {
    // Re-throw the original Stripe error with its message preserved
    throw error;
  }
}
