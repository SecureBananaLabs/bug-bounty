import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Stripe with the secret key from environment variables
// Ensure STRIPE_SECRET_KEY is set in your .env file or environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use a specific API version for stability
});

/**
 * Creates a Stripe Payment Intent.
 *
 * @param {object} payload - The payment intent payload.
 * @param {number} payload.amount - The amount to charge in the smallest currency unit (e.g., cents for USD). Must be a positive integer.
 * @param {string} [payload.currency="usd"] - The three-letter ISO currency code. Defaults to "usd".
 * @returns {Promise<{paymentId: string, clientSecret: string}>} A promise that resolves to an object containing the payment ID and client secret.
 * @throws {Error} If amount is missing or invalid, or if a Stripe API error occurs.
 */
export async function createPaymentIntent(payload) {
  // 1. Validate payload.amount
  if (!payload || typeof payload.amount !== 'number' || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: amount must be a positive integer representing the smallest currency unit.');
  }

  // 2. Set default currency
  const currency = payload.currency ?? 'usd';

  try {
    // 3. Make a real stripe.paymentIntents.create() call
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      // You can add more options here, e.g., metadata, description, etc.
      // For example: metadata: { order_id: '12345' }
    });

    // 4. Return the resolved value with clientSecret and paymentId
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    // 5. Handle Stripe API errors
    if (error.type && error.raw) {
      // This is a Stripe API error
      console.error('Stripe API Error:', error.message, error.raw);
      // Re-throw with the original Stripe error message preserved
      throw new Error(`Stripe Error: ${error.message}`);
    } else {
      // This is a generic error (e.g., network error, malformed response)
      console.error('Generic Error during Payment Intent creation:', error);
      throw new Error(`Failed to create Payment Intent: ${error.message}`);
    }
  }
}
