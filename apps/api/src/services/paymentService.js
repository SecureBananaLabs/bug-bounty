export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

/**
 * Creates a Stripe PaymentIntent
 * @param {Object} payload - Payment details
 * @param {number} payload.amount - Amount in smallest currency unit (e.g., cents)
 * @param {string} [payload.currency="usd"] - Three-letter ISO currency code
 * @param {Object} [payload.metadata] - Additional metadata for the payment
 * @returns {Object} Payment intent details
 */
export async function createPaymentIntent(payload) {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }

  // Set default currency if not provided
  const currency = payload.currency ?? "usd";

  try {
    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: payload.metadata || {}
    });

    // Return the required information
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    // Handle Stripe-specific errors and re-throw with original message
    if (error.type === 'StripeCardError') {
      throw new Error(`Stripe Card Error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Stripe Invalid Request Error: ${error.message}`);
    } else if (error.type === 'StripeAPIError') {
      throw new Error(`Stripe API Error: ${error.message}`);
    } else {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }
}
}
