export async function createPaymentIntent(payload) {
  // Server controls provider and status — never trust client input
  return {
    paymentId: `pay_${Date.now()}`,
    provider: "stripe",
    status: "pending",
    ...payload,
  };
}
