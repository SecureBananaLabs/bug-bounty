export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RangeError("Amount must be a positive number");
  }

  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
