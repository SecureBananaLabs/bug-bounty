import Stripe from 'stripe';
import { createPaymentIntent } from './paymentService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-01'
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer');
  }
  
  if (!payload.currency) {
    payload.currency = 'usd';
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency,
      // Include metadata if provided
      metadata: payload.metadata || {}
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      provider: "stripe"
    };
  } catch (error) {
    // Handle Stripe errors
    if (error.type) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
    throw error;
  }
}

// Original stub implementation
export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}