export async function createPaymentIntent(payload) {
  const createdAt = new Date().toISOString();

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe",
    createdAt
  };
}
