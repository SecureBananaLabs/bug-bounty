import Stripe from 'stripe';
import { env } from '../config/env.js';

const stripe = new Stripe(env.stripeSecretKey);

/**
 * Creates a Stripe PaymentIntent.
 * @param {Object} payload - Payment details.
 * @param {number} payload.amount - Amount in smallest currency unit (e.g., cents).
 * @param {string} [payload.currency] - ISO currency code (defaults to 'usd').
 * @param {Object} [payload.metadata] - Optional metadata for Stripe.
 * @returns {Promise<Object>} Stripe PaymentIntent response.
 */
export async function createPaymentIntent(payload) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency ?? "usd",
      metadata: payload.metadata ?? {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe"
    };
  } catch (error) {
    console.error("Stripe PaymentIntent Error:", error.message);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}
