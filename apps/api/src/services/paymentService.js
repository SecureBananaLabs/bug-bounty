import crypto from "node:crypto";

export async function createPaymentIntent(payload = {}) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const rawCurrency =
    typeof safePayload.currency === "string" && safePayload.currency.trim().length > 0
      ? safePayload.currency.trim()
      : "usd";

  return {
    paymentId: `pay_${crypto.randomUUID()}`,
    amount: safePayload.amount,
    currency: rawCurrency,
    provider: "stripe"
  };
}
