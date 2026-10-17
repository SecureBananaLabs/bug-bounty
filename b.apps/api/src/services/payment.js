const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  const currency = payload.currency ?? "usd";
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    };
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(error.message);
    }
    throw error;
  }
}