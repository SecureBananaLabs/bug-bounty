import Stripe from 'stripe';

let stripeClient = null;

export function initStripe(secretKey, stripeInstance) {
  if (stripeInstance) {
    stripeClient = stripeInstance;
  } else if (secretKey) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil',
    });
  }
}

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeClient = new Stripe(key, {
      apiVersion: '2025-03-31.basil',
    });
  }
  return stripeClient;
}

export async function createPaymentIntent(payload) {
  // Validate amount
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('Amount must be a positive integer');
  }

  const currency = (payload.currency || 'usd').toLowerCase();
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata || {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe',
    };
  } catch (error) {
    // Preserve Stripe error message
    throw new Error(error.message);
  }
}
