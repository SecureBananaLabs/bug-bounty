import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-07',
  typescript: true,
});
export async function createPaymentIntent(payload: { amount: number; currency?: string }) {
  const amount = payload.amount;
  const currency = payload.currency ?? "usd";
  
  if (amount === undefined || amount === null) {
    throw new Error('Amount is required');
  }
  
  if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Amount must be a positive integer representing the smallest currency unit');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency
    };
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(error.message);
    }
    throw new Error('Failed to create payment intent: ' + error.message);
  }
}