const payments = [];

export async function createPaymentIntent(payload) {
  const payment = {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
  payments.push(payment);
  return payment;
}

export async function getPaymentById(id) {
  return payments.find((p) => p.paymentId === id) || null;
}
