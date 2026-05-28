import Stripe from 'stripe';

// Stripe setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-01'
});

interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  [key: string]: any;
}

export async function createPaymentIntent(payload: CreatePaymentIntentParams) {
  // Validate amount
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer');
  }
  
  // Set default currency if not provided
  if (!payload.currency) {
    payload.currency = 'usd';
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency,
      metadata: payload.metadata || {}
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      provider: "stripe"
    };
  } catch (error) {
    if (error.type) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
    throw error;
  }
}

// Original stub implementation
export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}