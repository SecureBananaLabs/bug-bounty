export const paymentPriceCatalog = {
  project_deposit: {
    amount: 100,
    currency: "usd"
  },
  featured_job: {
    amount: 25,
    currency: "usd"
  }
};

export async function createPaymentIntent(payload) {
  const price = paymentPriceCatalog[payload.priceId];

  if (!price) {
    throw new Error(`Unknown payment price: ${payload.priceId}`);
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    priceId: payload.priceId,
    amount: price.amount,
    currency: price.currency,
    provider: "stripe"
  };
}
