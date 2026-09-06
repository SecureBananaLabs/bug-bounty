export const priceCatalog = {
  "starter": { amount: 2500, currency: "usd" },
  "pro": { amount: 7500, currency: "usd" },
  "enterprise": { amount: 20000, currency: "usd" }
};

export async function createPaymentIntent(priceId) {
  const price = priceCatalog[priceId];
  if (!price) {
    const error = new Error("Unknown price id");
    error.code = "PRICE_NOT_FOUND";
    throw error;
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    priceId,
    amount: price.amount,
    currency: price.currency,
    provider: "stripe"
  };
}
