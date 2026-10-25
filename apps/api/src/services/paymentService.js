export async function createPaymentIntent(payload) {
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    const error = new Error("Payment amount must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
