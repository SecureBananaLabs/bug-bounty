const SUPPORTED_PAYMENT_CURRENCIES = new Set(["usd"]);

export function normalizePaymentCurrency(currency) {
  if (currency == null) {
    return "usd";
  }

  if (typeof currency !== "string") {
    return "";
  }

  return currency.trim().toLowerCase();
}

export function isSupportedPaymentCurrency(currency) {
  return SUPPORTED_PAYMENT_CURRENCIES.has(normalizePaymentCurrency(currency));
}

export async function createPaymentIntent(payload) {
  const currency = normalizePaymentCurrency(payload.currency);

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
