export async function createPaymentIntent(payload) {
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency || "usd",
    provider: "stripe"
  };
}