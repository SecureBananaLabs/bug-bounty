export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    jobId: payload.jobId,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
