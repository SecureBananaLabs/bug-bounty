export async function createPaymentIntent(payload) {
  const { amount } = payload;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
