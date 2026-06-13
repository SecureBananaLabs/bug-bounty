const supportedCurrencies = new Set(["usd"]);

export function createPaymentIntent(payload) {
  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !supportedCurrencies.has(currency.toLowerCase())) {
    return { success: false, message: "Unsupported payment currency" };
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    success: true,
    data: {
      paymentId: `pay_${Date.now()}`,
      amount: payload.amount,
      currency: currency.toLowerCase(),
      provider: "stripe"
    }
  };
}
