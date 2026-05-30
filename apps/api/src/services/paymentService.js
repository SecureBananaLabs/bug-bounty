import Stripe from 'stripe';
import { env } from '../config/env.js';

export const stripe = new Stripe(env.stripeSecretKey);


/**
 * Creates a Stripe PaymentIntent.
 * 
 * @param {Object} payload 
 * @param {number} payload.amount - Amount in smallest currency unit (e.g., cents)
 * @param {string} [payload.currency='usd'] - Three-letter ISO currency code
 * @returns {Promise<{clientSecret: string, paymentId: string}>}
 */
export async function createPaymentIntent(payload) {
  const amount = payload?.amount;
  const currency = payload?.currency ?? 'usd';

  // Validation: amount is required, must be a positive integer
  if (!amount || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('payload.amount is required and must be a positive integer (cents)');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (err) {
    // Re-throw with the original message as per requirement
    const errorMessage = err.message || 'An unexpected error occurred with the payment provider';
    throw new Error(errorMessage);
  }
}

