export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ? payload.currency.trim().toLowerCase() : "usd",
    provider: "stripe"
  };
}
