
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid payload: amount is required and must be a positive integer');
  }
  
  const currency = payload.currency ?? "usd";
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency
    };
  } catch (error) {
    if (error.type === 'StripeCardError') {
      throw new Error(`Stripe card error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Stripe invalid request: ${error.message}`);
    } else {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }
}

  // Validate the payload before creating payment intent
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Invalid payload: amount is required and must be a positive integer');
  }
  
  const currency = payload.currency ?? "usd";
  
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
  } catch (error) {
    if (error.type === 'StripeCardError') {
      throw new Error(`Stripe card error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Stripe invalid request error: ${error.message}`);
    } else {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }
}
