import Stripe from 'stripe';
import { StripeError } from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

interface PaymentIntentPayload {
  amount: number;
  currency?: string;
  [key: string]: any; // Allow additional metadata
}

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  provider: string;
}

export async function createPaymentIntent(payload: PaymentIntentPayload): Promise<PaymentIntentResult> {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer (in smallest currency unit, e.g. cents)');
  }

  // Set default currency
  const currency = payload.currency ?? 'usd';

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      // In the future, you can add more options here
      // automatic_payment_methods: { enabled: true },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      amount: payload.amount,
      currency: currency,
      provider: 'stripe'
    };
  } catch (error) {
    // Re-throw Stripe errors with original message preserved
    if (error instanceof StripeError) {
      throw new Error(error.message);
    }
    throw error;
  }
}