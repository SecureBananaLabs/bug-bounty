import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../config/stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function createPaymentIntent(payload) {
  // Validate required parameters
  if (payload.amount === undefined || payload.amount === null || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer representing the smallest currency unit (e.g., cents)');
  };

  const currency = payload.currency || "usd";
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency
    };
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(`Stripe API error: ${error.message}`);
    }
    throw error;
  }
}