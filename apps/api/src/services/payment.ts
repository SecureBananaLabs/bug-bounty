export async function createPaymentIntent(payload) {
  const stripe = require('stripe');
  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer');
  }
  
  if (!payload.currency) {
    payload.currency = "usd";
  }

  // Create PaymentIntent with Stripe
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency,
    payment_method_types: ['card'],
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    ...paymentIntent
  };
}

export async function createPaymentIntent(payload) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  // Validate amount
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer');
  }
  
  // Set default currency if not provided
  const currency = payload.currency || 'usd';
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      payment_method_types: ['card']
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    };
  } catch (error) {
    if (error.type === 'StripeCardError') {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}