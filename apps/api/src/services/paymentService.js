import { randomUUID } from "crypto";

const VALID_CURRENCIES = ["usd", "eur", "gbp", "cny"];

export async function createPaymentIntent(payload) {
  const { amount, currency } = payload;

  if (typeof amount !== "number" || amount <= 0 || amount > 100000) {
    throw new Error("amount must be a positive number up to 100000");
  }
  if (!VALID_CURRENCIES.includes(currency ?? "usd")) {
    throw new Error(`currency must be one of: ${VALID_CURRENCIES.join(", ")}`);
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${randomUUID()}`,
    amount,
    currency: currency ?? "usd",
    provider: "stripe"
  };
}
