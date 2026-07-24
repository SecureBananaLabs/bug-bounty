import Stripe from 'stripe';
import { createPaymentIntent } from './paymentService';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-03',
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency || 'usd',
  });

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
}