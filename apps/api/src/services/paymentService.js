export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  // Normalize the currency code to lowercase ISO-4217 form so callers that
  // send "USD" do not get back uppercase responses. Defaults to "usd" when
  // the caller omits a currency so the existing fallback path still applies.
  const currency = (payload.currency ?? "usd").toLowerCase();
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
