export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  if (!payload.amount || typeof payload.amount !== "number" || payload.amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}