import Stripe from 'stripe';

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

interface PaymentPayload {
  amount: number;
  currency?: string;
}

export async function createPaymentIntent(payload: {amount: number, currency?: string}): Promise<PaymentIntentResult> {
  // Validate required inputs
  if (!payload || !payload.amount || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  if (!Number.isInteger(payload.amount)) {
    throw new Error('Amount must be an integer');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency || 'usd',
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret as string,
    };
  } catch (error) {
    if (error.type) {
      throw new Error(error.message);
    } else {
      throw error;
    }
  }
}