import Stripe from 'stripe';
import { Stripe as StripeType } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-06',
});

interface PaymentPayload {
  amount: number;
  currency?: string;
}

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
}

export async function createPaymentIntent(payload: PaymentPayload): Promise<PaymentIntentResult> {
  // Validate payload
  const amount = payload.amount;
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  const currency = payload.currency || 'usd';
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret as string,
    };
  } catch (error) {
    if (error.type === 'StripeCardError') {
      throw new Error(`Payment error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    } else {
      throw error;
    }
  }
}