import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

interface PaymentPayload {
  amount: number;
  currency?: string;
  [key: string]: any;
}

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  [key: string]: any;
}

/**
 * Creates a Stripe PaymentIntent
 * @param payload - The payment details
 */
export async function createPaymentIntent(payload: any): Promise<PaymentIntentResult> {
  // Validate amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  const currency = payload.currency ?? "usd";
  
  try {
    // Create the actual PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: payload.amount,
      currency: currency
    };
  } catch (error: any) {
    // Handle Stripe errors and preserve original messages
    if (error.type) {
      throw new Error(error.message);
    }
    throw error;
  }
}

// If we need to maintain the original function signature from the issue
export async function createPaymentIntent(payload: PaymentPayload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}