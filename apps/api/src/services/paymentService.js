let payments = [];

export async function listPayments() {
  return [...payments];
}

export async function getPaymentById(id) {
  return payments.find((p) => p.paymentId === id || p.id === id) || null;
}

export async function createPaymentIntent(payload) {
  const payment = {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe",
    status: "created",
    createdAt: new Date().toISOString()
  };
  payments.push(payment);
  return payment;
}

export function _resetPayments() {
  payments = [];
}
