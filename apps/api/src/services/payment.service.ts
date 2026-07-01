import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});
export async function createPaymentIntent(payload: any) {
  const amount = payload.amount;
  const currency = payload.currency ?? "usd";
  
  if (amount === undefined || amount === null) {
    throw new Error('Amount is required and must be a positive integer');
  }
  
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer (smallest currency unit, e.g. cents)');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency || 'usd',
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: payload.currency ?? "usd",
      provider: "stripe"
    };
  } catch (error: any) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(error.message);
    }
    throw new Error('Failed to create payment intent: ' + error.message);
  }
}