export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  // Trim the currency code so callers that send " USD " do not get back a
  // padded response. The default "usd" fallback applies when the caller
  // omits a currency so existing behavior is preserved.
  const currency = (payload.currency ?? "usd").trim();
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
