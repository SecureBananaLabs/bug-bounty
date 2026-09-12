export async function createPaymentIntent(payload) {
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount)) {
    throw new Error("amount must be a finite number");
  }
  if (amount <= 0) {
    throw new Error("amount must be positive");
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
