import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51DummyKeyForDevelopmentOnly', {
  apiVersion: '2024-11-20.acacia',
});

export async function createPaymentIntent(payload) {
  // Validate amount - required and must be positive integer
  if (!payload.amount && payload.amount !== 0) {
    throw new Error('amount is required and must be a positive integer');
  }
  
  const amount = Number(payload.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }
  
  // Validate currency - optional, defaults to "usd"
  const currency = (payload.currency || 'usd').toLowerCase();
  
  try {
    // Create real PaymentIntent with Stripe API
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      provider: 'stripe'
    };
  } catch (error) {
    // Re-throw Stripe errors with original message preserved
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
}
