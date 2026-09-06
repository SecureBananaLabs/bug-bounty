export async function createPaymentIntent(payload) {
  const currency = payload.currency?.trim() ?? "usd";

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
