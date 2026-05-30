import { createEntityId } from "../utils/ids.js";

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: createEntityId("pay"),
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
