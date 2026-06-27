export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const currency = (payload.currency ?? "usd").toLowerCase();

  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
