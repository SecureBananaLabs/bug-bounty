import { generateId } from "./utils/id.js";

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: generateId("pay"),
    amount: payload.amount,
    currency: (payload.currency ?? "usd").toLowerCase(),
    provider: "stripe"
  };
}
