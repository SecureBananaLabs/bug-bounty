let paymentCounter = 0;

function generatePaymentId() {
  paymentCounter++;
  return `pay_${Date.now()}_${paymentCounter}`;
}

export async function createPaymentIntent(payload = {}) {
  return {
    ...payload,
    paymentId: generatePaymentId(),
    currency: payload.currency ?? "usd",
    provider: "stripe",
  };
}
