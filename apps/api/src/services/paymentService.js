export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const createdAt = new Date().toISOString();
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe",
    createdAt
  };
}
