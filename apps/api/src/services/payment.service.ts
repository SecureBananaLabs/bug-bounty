import Stripe from 'stripe';

// Initialize Stripe client with secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

export interface CreatePaymentIntentPayload {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  description?: string;
}

export interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  provider: string;
}

/**
 * Creates a Stripe PaymentIntent and returns the client secret and payment ID.
 *
 * @param payload - The payment intent creation payload
 * @param payload.amount - Required positive integer in smallest currency unit (e.g., cents)
 * @param payload.currency - Optional currency code, defaults to "usd"
 * @param payload.metadata - Optional metadata to attach to the PaymentIntent
 * @param payload.description - Optional description for the PaymentIntent
 * @returns PaymentIntentResult containing clientSecret, paymentId, amount, currency, and provider
 * @throws Error if amount is missing or invalid
 * @throws StripeError for Stripe API errors with original error message preserved
 */
export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload
): Promise<PaymentIntentResult> {
  // Validate amount is required and is a positive integer
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('amount is required and must be a positive integer');
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount must be a positive integer in smallest currency unit (e.g., cents)');
  }

  // Default currency to "usd" if not provided
  const currency = payload.currency ?? 'usd';

  try {
    // Create a real Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata,
      description: payload.description,
    });

    // Return the client secret and payment ID from Stripe
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe',
    };
  } catch (error) {
    // Handle Stripe API errors and preserve the original error message
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }

    // Re-throw non-Stripe errors
    throw error;
  }
}