import Stripe from 'stripe';
import { PaymentIntent } from '@prisma/client';

// Initialize Stripe with secret key from environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-01', // Use appropriate API version
});

export async function createPaymentIntent(payload: { amount: number; currency?: string; metadata?: Record<string, string> }) {
  // Validate amount
  if (!payload.amount || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('Amount is required and must be a positive integer');
  }

  // Set default currency to USD if not provided
  const currency = payload.currency || 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: payload.currency ?? "usd",
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}