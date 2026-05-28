import Stripe from 'stripe';
import { PaymentIntent } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-01',
});

export async function createPaymentIntent(payload: any) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer');
  }

  const currency = payload.currency || 'usd';
  
  try {
    const intent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      clientSecret: intent.client_secret,
      paymentId: intent.id,
      amount: payload.amount,
      currency: payload.currency ?? "usd",
      provider: "stripe"
    };
  } catch (error: any) {
    throw new Error(`Stripe error: ${error.message}`);
  }
}