import Stripe from 'stripe';
import { PaymentIntentPayload } from '../types/payment.types';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
  typescript: true,
});

/**
 * Creates a Stripe PaymentIntent for processing payments
 * @param payload - Payment details including amount and currency
 * @returns PaymentIntent result with client secret and payment ID
 */
export async function createPaymentIntent(payload: PaymentIntentPayload) {
  // Validate required amount field
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  // Validate amount is a positive integer
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer representing the smallest currency unit (e.g., cents)');
  }
  
  // Set default currency to USD if not provided
  const currency = payload.currency ?? 'usd';
  
  try {
    // Create a PaymentIntent with the specified amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: payload.metadata ? payload.metadata : {},
    });
    
    // Return the client secret and payment ID from the created PaymentIntent
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
      provider: 'stripe'
    };
  } catch (error) {
    // Handle Stripe-specific errors and re-throw with meaningful messages
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
    
    // Handle other unexpected errors
    throw new Error(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieves a PaymentIntent by ID
 * @param paymentIntentId - The ID of the PaymentIntent to retrieve
 * @returns PaymentIntent object
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
    throw new Error(`Failed to retrieve payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}