import { stripe } from '@packages/stripe';

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date0) {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency || "usd",
    provider: "stripe"
  };
}