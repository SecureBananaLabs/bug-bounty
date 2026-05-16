import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(payload) {
  try {
    // Convert amount to cents (assuming payload.amount is in dollars)
    const amountInCents = Math.round(payload.amount * 100);
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: payload.currency ?? 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the required object
    return {
      paymentId: paymentIntent.id,
      amount: payload.amount, // Keep original amount in dollars
      currency: payload.currency ?? 'usd',
      provider: 'stripe',
      client_secret: paymentIntent.client_secret,
    };
  } catch (error) {
    // Handle Stripe errors
    console.error('Stripe error:', error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
}
