const crypto = require('crypto');

let lastIdTimestamp = 0;
let idSequence = 0;

/**
 * Generate a collision-resistant payment intent ID.
 *
 * Same-millisecond calls receive a strictly increasing sequence component,
 * and a short crypto-random suffix keeps IDs unique across processes and
 * server restarts. The existing `pay_` prefix is preserved.
 */
function generatePaymentId() {
  const now = Date.now();
  if (now <= lastIdTimestamp) {
    idSequence += 1;
  } else {
    lastIdTimestamp = now;
    idSequence = 0;
  }
  return `pay_${now}${idSequence.toString(36)}${crypto.randomBytes(4).toString('hex')}`;
}

export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
  const intent = {
    paymentId: generatePaymentId(),
    amount,
    currency,
    status: 'requires_confirmation',
    createdAt: new Date().toISOString(),
  };
module.exports.generatePaymentId = generatePaymentId;
