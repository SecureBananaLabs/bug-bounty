export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export async function createPaymentIntent(payload) {
  const amount = Number(payload.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new PaymentValidationError("Payment amount must be a positive number");
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
