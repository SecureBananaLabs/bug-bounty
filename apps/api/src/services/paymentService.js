export async function createPaymentIntent(payload) {
  // Validate that amount is positive
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error("Payment amount must be a positive number"), { statusCode: 400 });
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
