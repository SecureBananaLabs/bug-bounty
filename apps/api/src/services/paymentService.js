const SUPPORTED_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud"];

export async function createPaymentIntent(payload) {
  const amount = Number(payload.amount);
  const currency = (payload.currency ?? "usd").toLowerCase().trim();

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw Object.assign(new Error(`Unsupported currency: ${currency}. Supported: ${SUPPORTED_CURRENCIES.join(", ")}`), { status: 400 });
  }

  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency,
    provider: "stripe"
  };
}
