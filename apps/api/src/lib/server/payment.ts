import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export async function createPaymentIntent(payload: { amount: number; currency?: string; customerEmail?: string; }) {
  if (!payload.amount || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  const amount = payload.amount;
  const currency = payload.currency ?? "usd";
  const clientSecret = process.env.STRIPE_SECRET_KEY ? 'sk_test_...' : 'sk_live_...';
  return { paymentId: `pi_`, clientSecret };