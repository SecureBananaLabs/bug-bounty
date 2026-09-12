import Stripe from 'stripe';

export async function createPaymentIntent(payload) {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  // Validate payload.amount (required, positive integer)
  if (typeof payload.amount !== 'number' || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }

  // Default currency to 'usd'
  const currency = payload.currency ?? 'usd';

  try {
    const intent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
    });

    return {
      paymentId: intent.id,
      clientSecret: intent.client_secret,
    };
  } catch (error) {
    // Handle Stripe errors by catching and re-throwing with original message
    throw new Error(error.message);
  }
}
