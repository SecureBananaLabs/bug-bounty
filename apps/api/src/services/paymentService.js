export async function createPaymentIntent(payload) {
  const amount = Number(payload?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Payment amount must be a positive number");
    error.status = 400;
    throw error;
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
