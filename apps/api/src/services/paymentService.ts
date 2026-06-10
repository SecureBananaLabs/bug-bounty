import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
  typescript: true,
});

interface PaymentIntentPayload {
  amount: number;
  currency?: string;
  [key: string]: any;
}

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export async function createPaymentIntent(payload: PaymentIntentPayload): Promise<PaymentIntentResult> {
  // Validate required parameters
  if (payload.amount === undefined || payload.amount === null || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer representing the smallest currency unit (e.g., cents)');
  }

  const currency = payload.currency || "usd";
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency
    };
  } catch (error: any) {
    if (error.type && typeof error.type === 'string' && error.type.startsWith('Stripe')) {
      throw new Error(`Stripe API error: ${error.message}`);
    }
    throw error;
  }
}