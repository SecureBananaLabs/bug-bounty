export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || payload.amount <= 0) {
    throw new Error('Invalid amount');
  }
  
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency,
    payment_method_types: ['card'],
  });
  
  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret
  };
}