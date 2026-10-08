function normalizeCurrency(currency) {
  // Providers reject padded or upper-case codes, and a whitespace-only value
  // has to fall back like a missing one instead of being stored as-is.
  const normalized = typeof currency === "string" ? currency.trim().toLowerCase() : currency;

  return normalized || "usd";
}

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    provider: "stripe"
  };
}
