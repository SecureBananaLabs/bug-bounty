export async function createPaymentIntent(payload) {
  if (payload?.amount === undefined || payload?.amount === null || typeof payload.amount !== "number" || payload.amount <= 0) {
    const error = new Error("Payment amount must be a positive number greater than zero");
    error.status = 400;
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
