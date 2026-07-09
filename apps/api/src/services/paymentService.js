const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;

function normalizeCurrencyCode(currency) {
  if (currency == null) {
    return "USD";
  }

  if (typeof currency !== "string") {
    throw new TypeError("currency must be a 3-letter code");
  }

  const normalizedCurrency = currency.trim().toUpperCase();

  if (!CURRENCY_CODE_PATTERN.test(normalizedCurrency)) {
    throw new TypeError("currency must be a 3-letter code");
  }

  return normalizedCurrency;
}

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: normalizeCurrencyCode(payload.currency),
    provider: "stripe"
  };
}
