export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  // Previously jobId was accepted in the payload but silently dropped
  // from the response, breaking downstream payment-to-job linkage.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    jobId: payload.jobId,
    provider: "stripe"
  };
}

