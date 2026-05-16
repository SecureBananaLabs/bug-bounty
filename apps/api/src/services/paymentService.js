import Stripe from 'stripe';
import { env } from '../config/env.js';
import { z } from 'zod';

const stripe = new Stripe(env.stripeSecretKey);

// Stripe Metadata limits: 40 chars per key, 500 chars per value, max 50 keys.
const MetadataSchema = z.record(
  z.string().max(40, { message: "Metadata key exceeds 40 characters" }),
  z.string().max(500, { message: "Metadata value exceeds 500 characters" })
).refine(m => Object.keys(m).length <= 50, {
  message: "Metadata cannot have more than 50 keys"
});

const PaymentIntentSchema = z.object({
  amount: z.number().int().positive({ message: "Amount must be a positive integer in the smallest currency unit" }),
  currency: z.string().length(3).optional().default("usd"),
  metadata: MetadataSchema.optional()
});

/**
 * Creates a real Stripe PaymentIntent and returns the client secret.
 * @param {Object} payload - The payment details
 * @returns {Promise<Object>} The paymentId and clientSecret
 * @throws {Error} If validation fails or Stripe API returns an error
 */
export async function createPaymentIntent(payload) {
  // 1. Validate Input (Zod schema covers amount, currency, and strict metadata limits)
  const validation = PaymentIntentSchema.safeParse(payload);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => i.message).join(', ');
    const error = new Error(`Validation Error: ${errorMsg}`);
    error.status = 400; // Bad Request
    throw error;
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
       // Wrap Stripe errors with appropriate status codes for the controller
       const customError = new Error(error.message);
       customError.status = (error.statusCode === 401 || error.statusCode === 403) ? 502 : (error.statusCode || 500);
       throw customError;
    }
    throw error;
  }
}
