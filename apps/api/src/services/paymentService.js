const SUPPORTED_CURRENCIES = new Set(["usd", "eur", "gbp"]);

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export async function createPaymentIntent(payload) {
  const rawCurrency = payload.currency ?? "usd";
  const currency = String(rawCurrency).trim().toLowerCase();

  if (!SUPPORTED_CURRENCIES.has(currency)) {
    throw new PaymentValidationError(`Unsupported payment currency: ${rawCurrency}`);
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
