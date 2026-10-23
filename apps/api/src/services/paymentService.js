export async function createPaymentIntent(payload = {}) {
  const rawCurrency =
    typeof payload.currency === "string" && payload.currency.trim() !== ""
      ? payload.currency.trim().toLowerCase()
      : "usd";

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: rawCurrency,
    provider: "stripe"
  };
}
