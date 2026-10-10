import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload || !payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency || 'usd',
    payment_method_types: ['card']
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    amount: payload.amount,
    currency: payload.currency || "usd"
  };
}