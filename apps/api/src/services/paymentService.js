export async function createPaymentIntent(payload) {
  const currency = (payload.currency ?? "usd").toString().trim().toLowerCase();
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}