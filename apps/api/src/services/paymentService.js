export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  // Providers expect a lowercase ISO code, so normalise whatever the client
  // sends (" USD " -> "usd") and fall back when nothing useful was supplied.
  const rawCurrency = String(payload.currency ?? "").trim();
  const currency = rawCurrency === "" ? "usd" : rawCurrency.toLowerCase();

  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
