import Stripe from 'stripe';
import { PaymentIntentPayload } from '../types/payment.types';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
  typescript: true,
});

export async function createPaymentIntent(payload: PaymentIntentPayload) {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer in smallest currency unit');
  }

  // Set default currency to USD if not provided
  const currency = payload.currency || 'usd';
  
  try {
    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      // Add metadata if provided in payload
      ...(payload.metadata && { metadata: payload.metadata })
    });

    // Return the client secret and payment ID
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: payload.amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    // Re-throw Stripe errors with original messages preserved
    throw error;
  }
}