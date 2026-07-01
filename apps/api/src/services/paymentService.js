import crypto from "crypto";
export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${crypto.randomUUID()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}