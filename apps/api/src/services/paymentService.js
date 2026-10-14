let lastPaymentTimestamp = 0;
let paymentSequence = 0;

function nextPaymentId() {
  const timestamp = Date.now();

  if (timestamp === lastPaymentTimestamp) {
    paymentSequence += 1;
  } else {
    lastPaymentTimestamp = timestamp;
    paymentSequence = 0;
  }

  return `pay_${timestamp}_${paymentSequence.toString(36)}`;
}

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: nextPaymentId(),
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
