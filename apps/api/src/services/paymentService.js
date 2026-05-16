import Stripe from 'stripe';
import { env } from '../config/env.js';
import { z } from 'zod';

const stripe = new Stripe(env.stripeSecretKey);

const PaymentIntentSchema = z.object({
  amount: z.number().int().positive({ message: "Amount must be a positive integer in the smallest currency unit" }),
  currency: z.string().length(3).optional().default("usd"),
  metadata: z.record(z.string()).optional()
});

/**
 * Creates a real Stripe PaymentIntent and returns the client secret.
 * @param {Object} payload - The payment details
 * @returns {Promise<Object>} The paymentId and clientSecret
 * @throws {Error} If validation fails or Stripe API returns an error
 */
export async function createPaymentIntent(payload) {
  // 1. Validate Input
  const validation = PaymentIntentSchema.safeParse(payload);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => i.message).join(', ');
    throw new Error(`Validation Error: ${errorMsg}`);
  }

  const { amount, currency, metadata } = validation.data;

  try {
    // 2. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata
    });

    // 3. Return mapped values
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      provider: "stripe"
    };
  } catch (error) {
    // 4. Handle Stripe specific errors
    if (error.type) {
       // Preserving the original Stripe error message
       throw new Error(error.message);
    }
    throw error;
  }
}
