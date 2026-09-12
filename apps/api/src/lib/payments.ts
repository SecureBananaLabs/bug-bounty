import Stripe from 'stripe';
import { Stripe as stripePackage } from 'stripe';

let stripe: Stripe;

export async function createPaymentIntent(payload) {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-05-13', // Use a fixed date version
      maxNetworkRetries: 3,
    });
  }
  
  // Validate payload.amount is required
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  // Create a payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency || "usd",
    provider: "stripe"
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id
  };
}

export { createPaymentIntent };
