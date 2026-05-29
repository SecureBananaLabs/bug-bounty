import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export async function createPaymentIntent(payload) {
  // Validate payload
  if (!payload.amount || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount is required and must be a positive integer');
  }

  const currency = payload.currency ?? 'usd';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    // Re-throw Stripe errors with original message preserved
    throw new Error(error.message);
  }
}
