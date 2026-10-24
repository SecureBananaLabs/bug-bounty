export async function createPaymentIntent(payload) {
  const currency = typeof payload.currency === "string"
    ? payload.currency.toLowerCase()
    : payload.currency ?? "usd";

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
