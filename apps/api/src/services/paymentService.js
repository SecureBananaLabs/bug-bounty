export async function createPaymentIntent(payload) {
  if (typeof payload.amount !== "number" || !Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw Object.assign(new Error("Amount must be a positive number"), { status: 400 });
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
