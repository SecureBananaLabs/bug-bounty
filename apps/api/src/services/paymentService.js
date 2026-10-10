export async function createPaymentIntent(payload) {
  if (
    !payload ||
    typeof payload.amount !== "number" ||
    !Number.isFinite(payload.amount) ||
    payload.amount <= 0
  ) {
    return {
      error: "Amount must be a positive number"
    };
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
