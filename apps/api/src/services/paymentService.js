export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  const intent = {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };

  if (payload.jobId !== undefined) {
    intent.jobId = payload.jobId;
  }

  return intent;
}
