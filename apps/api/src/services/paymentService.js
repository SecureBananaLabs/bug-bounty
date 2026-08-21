export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
  const paymentIntent = {
    amount: payload.amount,
    currency: (payload.currency ?? 'usd').toLowerCase(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
