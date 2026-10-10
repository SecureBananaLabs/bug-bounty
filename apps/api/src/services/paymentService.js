import { createPrefixedId } from "../utils/id.js";

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: createPrefixedId("pay"),
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
