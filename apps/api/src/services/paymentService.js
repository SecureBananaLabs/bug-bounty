function parseAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be a finite positive number");
  }

  return amount;
}

function parseCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("Payment currency must be a three-letter code");
  }

  return currency.toLowerCase();
}

export async function createPaymentIntent(payload) {
  const amount = parseAmount(payload.amount);
  const currency = parseCurrency(payload.currency);

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency,
    provider: "stripe"
  };
}
