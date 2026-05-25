import Stripe from 'stripe';
import { Stripe as StripeType } from 'stripe';

let stripe: StripeType | null = null;

function getStripeInstance(): StripeType {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
  }
  return stripe;
}

export async function createPaymentIntent(payload: any) {
  // Validate amount
  if (!payload.amount || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('Amount is required and must be a positive integer (in smallest currency unit)');
  }

  const currency = payload.currency ?? 'usd';
  
  try {
    const stripe = getStripeInstance();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
    };
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}