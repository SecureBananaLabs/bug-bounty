import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
// For unit tests we allow passing a mocked Stripe client, but in prod we instantiate it.
let stripeClient = null;

if (stripeSecretKey) {
  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}

export async function createPaymentIntent(payload, _stripeMock = null) {
  const stripe = _stripeMock || stripeClient;
  
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY environment variable is missing.');
  }

  if (payload.amount === undefined || payload.amount === null || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    const err = new Error('Invalid amount: amount must be a positive integer representing the smallest currency unit.');
    err.type = 'StripeInvalidRequestError';
    throw err;
  }

  const currency = payload.currency ?? "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      paymentId: paymentIntent.id,
      amount: payload.amount,
      currency: currency,
      provider: "stripe",
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    // Preserve Stripe error message
    const err = new Error(error.message);
    err.type = error.type || 'StripeAPIError';
    err.raw = error;
    throw err;
  }
}
