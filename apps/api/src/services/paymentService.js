export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const rawCurrency = payload.currency ?? "usd";
  const currency = String(rawCurrency).trim().toLowerCase() || "usd";
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
