import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export interface CreatePaymentIntentPayload {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentId: string;
}

export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload
): Promise<PaymentIntentResult> {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required');
  }

  if (typeof payload.amount !== 'number' || !Number.isInteger(payload.amount)) {
    throw new Error('amount must be a positive integer (smallest currency unit, e.g., cents)');
  }

  if (payload.amount <= 0) {
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
      clientSecret: paymentIntent.client_secret!,
      paymentId: paymentIntent.id,
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}