export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

export async function createPaymentIntent(payload) {
  // Validate required fields
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }

  // Set default currency
  const currency = payload.currency ?? "usd";

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    // Re-throw Stripe errors with original message preserved
    if (error.type === 'StripeCardError') {
      throw new Error(`Stripe Card Error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Stripe Invalid Request Error: ${error.message}`);
    } else {
      throw new Error(`Stripe Error: ${error.message}`);
    }
  }
}
}
