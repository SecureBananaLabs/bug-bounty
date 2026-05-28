const VALID_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud"];

export async function createPaymentIntent(payload) {
  const { amount, currency } = payload;

  if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    const err = new Error("Invalid payment amount: must be a positive number");
    err.status = 400;
    throw err;
  }

  if (currency && !VALID_CURRENCIES.includes(currency.toLowerCase())) {
    const err = new Error(`Invalid currency: must be one of ${VALID_CURRENCIES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: (currency ?? "usd").toLowerCase(),
    provider: "stripe"
  };
}
