import Stripe from 'stripe';
import { env } from '../env';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

interface PaymentIntentPayload {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  [key: string]: any;
}

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

/**
 * Creates a Stripe PaymentIntent
 * @param payload - The payment intent details
 * @returns The created payment intent details
 */
export async function createPaymentIntent(payload: PaymentIntentPayload): Promise<PaymentIntentResult> {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  // Set default currency if not provided
  const currency = payload.currency ?? 'usd';
  
  try {
    // Create the actual PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata || {}
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: payload.amount,
      currency
    };
  } catch (error) {
    // Re-throw Stripe errors with original messages preserved
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Alternative implementation that matches the existing function signature exactly
 */
export async function createPaymentIntent(payload: any) {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  const currency = payload.currency ?? "usd";
  
  try {
    // Create the actual PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: payload.amount,
      currency: currency
    };
  } catch (error: any) {
    // Re-throw Stripe errors with original messages preserved
    if (error.type && error.message) {
      // This preserves Stripe error messages
      throw new Error(error.message);
    }
    throw error;
  }
}