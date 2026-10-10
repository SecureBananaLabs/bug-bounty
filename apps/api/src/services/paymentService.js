function normalizeCurrency(currency) {
  if (currency == null) {
    return "usd";
  }

  if (typeof currency === "string") {
    return currency.trim().toLowerCase() || "usd";
  }

  return currency;
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
