import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

interface PaymentPayload {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface PaymentResult {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  provider: string;
}

export async function createPaymentIntent(payload: PaymentPayload): Promise<PaymentResult> {
  if (typeof payload.amount !== 'number' || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('amount is required and must be a positive integer');
  }

  const currency = payload.currency ?? 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: payload.amount,
      currency,
      provider: 'stripe',
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}
