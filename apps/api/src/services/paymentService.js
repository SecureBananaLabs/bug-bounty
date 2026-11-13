export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

function validatePositiveAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new PaymentValidationError("Payment amount must be a positive number");
  }

  return amount;
}

export async function createPaymentIntent(payload) {
  const amount = validatePositiveAmount(payload?.amount);

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
