const stripe = require('stripe');

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer');
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency || 'usd'
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id
  };
}

export { createPaymentIntent };