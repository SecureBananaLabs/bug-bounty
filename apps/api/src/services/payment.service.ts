import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

interface CreatePaymentIntentPayload {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  provider: string;
}

export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload
): Promise<PaymentIntentResult> {
  // Validate amount is required and must be a positive integer
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required');
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount must be a positive integer (smallest currency unit, e.g., cents)');
  }

  // Default currency to 'usd' if not provided
  const currency = payload.currency ?? 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: payload.amount,
      currency,
      provider: 'stripe',
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      // Preserve the original Stripe error message
      throw new Error(error.message);
    }
    throw error;
  }
}

export { stripe };