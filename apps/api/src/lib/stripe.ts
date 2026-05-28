import { loadStripe } from '@stripe/stripe-js';

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const stripe = await loadStripe(process.env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    // Add other required fields
  });
  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: payload.amount,
    currency: payload.currency ?? "usd"
  };
}