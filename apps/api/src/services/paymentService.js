export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    provider: "stripe"
  };
}

function normalizeCurrency(currency) {
  return typeof currency === "string" && currency.length > 0
    ? currency.toUpperCase()
    : "USD";
}
