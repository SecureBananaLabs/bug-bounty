import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export async function createPaymentIntent(payload) {
  // Validate the payload
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  const currency = payload.currency || "usd";
  
  // Create the payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: currency,
    payment_method_types: ['card']
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    amount: payload.amount,
    currency: payload.currency || "usd"
  };
}

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// TODO: integrate Stripe SDK and return client secret.
export async function createPaymentIntent(payload) {
  // Implementation will be replaced with real Stripe integration
}