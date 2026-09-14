export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const currency = typeof payload.currency === "string" && payload.currency.trim()
    ? payload.currency.trim().toLowerCase()
    : "usd";

  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
