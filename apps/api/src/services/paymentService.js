import Stripe from 'stripe';
import { env } from '../config/env.js';

const stripe = new Stripe(env.stripeSecretKey);

export async function createPaymentIntent(payload) {
  // Validate amount - must be positive integer
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('amount is required and must be a positive integer (smallest currency unit, e.g. cents)');
  }

  // Currency defaults to 'usd' if not provided
  const currency = payload.currency ?? 'usd';

  try {
    // Create real Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    // Return formatted response with client_secret
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe'
    };
  } catch (error) {
    throw new Error(`Stripe API error: ${error.message}`);
  }
}