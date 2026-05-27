import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Validation schema for payment payload
const PaymentPayloadSchema = z.object({
  amount: z.number().positive().int(),
  currency: z.string().optional().default('usd'),
  metadata: z.record(z.string()).optional(),
});

export interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  provider: string;
}

export async function createPaymentIntent(payload: any): Promise<PaymentIntentResult> {
  try {
    // Validate payload
    const validatedPayload = PaymentPayloadSchema.parse(payload);
    
    // Ensure amount is provided and is a positive integer
    if (!validatedPayload.amount || validatedPayload.amount <= 0) {
      throw new Error('Amount is required and must be a positive integer');
    }

    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validatedPayload.amount,
      currency: validatedPayload.currency,
      metadata: validatedPayload.metadata || {},
    });

    // Return the required response format
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe'
    };

  } catch (error) {
    // Handle Stripe-specific errors
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    // Re-throw with original error message preserved
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    
    throw new Error('An unknown error occurred during payment processing');
  }
}