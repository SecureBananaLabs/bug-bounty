const crypto = require('crypto');

/**
 * Mock payment service.
 *
 * Payment intents are kept in memory. IDs are generated server-side and must
 * stay unique even when multiple intents are created in the same millisecond.
 */

const paymentIntents = new Map();

// Monotonic state backing generatePaymentId(). Kept at module scope so the
// sequence is preserved across requests handled by this process.
let lastGeneratedAt = 0;
let sameMillisecondSequence = 0;

/**
 * Generate a unique payment ID.
 *
 * Keeps the historical pay_ prefix and combines:
 *  - the millisecond timestamp (IDs stay roughly sortable, as before),
 *  - a per-millisecond sequence counter (deterministic uniqueness for
 *    same-millisecond requests within this process),
 *  - a random suffix (uniqueness across processes and restarts).
 *
 * @returns {string} unique payment ID, e.g. pay_1724313600000_1_a3f9c2d1
 */
function generatePaymentId() {
  const now = Date.now();

  if (now <= lastGeneratedAt) {
    // Same millisecond (or the clock moved backwards): keep incrementing
    // the sequence instead of resetting it, so no two IDs can collide here.
    sameMillisecondSequence += 1;
  } else {
    lastGeneratedAt = now;
    sameMillisecondSequence = 0;
  }

  const randomSuffix = crypto.randomBytes(4).toString('hex');

  return `pay_${lastGeneratedAt}_${sameMillisecondSequence.toString(36)}_${randomSuffix}`;
}

function assertPositiveAmount(amount) {
  const normalized = Number(amount);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    const error = new Error('A positive amount is required to create a payment intent');
    error.status = 400;
    throw error;
  }

  return normalized;
}

async function createPaymentIntent(payload = {}) {
  const { amount, currency = 'usd', userId = null, jobId = null, description = null } = payload;

  const normalizedAmount = assertPositiveAmount(amount);
  const paymentId = generatePaymentId();
  const nowIso = new Date().toISOString();

  const intent = {
    paymentId,
    clientSecret: `${paymentId}_secret_${crypto.randomBytes(8).toString('hex')}`,
    amount: Math.round(normalizedAmount),
    currency: String(currency).toLowerCase(),
    status: 'requires_confirmation',
    userId,
    jobId,
    description,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  paymentIntents.set(paymentId, intent);

  return { ...intent };
}

async function getPaymentIntent(paymentId) {
  const intent = paymentIntents.get(paymentId);

  if (!intent) {
    const error = new Error('Payment intent not found');
    error.status = 404;
    throw error;
  }

  return { ...intent };
}

async function listPaymentIntents() {
  return [...paymentIntents.values()].map((intent) => ({ ...intent }));
}

async function confirmPaymentIntent(paymentId) {
  const intent = await getPaymentIntent(paymentId);

  if (intent.status === 'succeeded') {
    return intent;
  }

  const updated = { ...intent, status: 'succeeded', updatedAt: new Date().toISOString() };
  paymentIntents.set(paymentId, updated);

  return { ...updated };
}

async function cancelPaymentIntent(paymentId) {
  const intent = await getPaymentIntent(paymentId);

  if (intent.status === 'succeeded') {
    const error = new Error('Cannot cancel a payment intent that already succeeded');
    error.status = 409;
    throw error;
  }

  const updated = { ...intent, status: 'canceled', updatedAt: new Date().toISOString() };
  paymentIntents.set(paymentId, updated);

  return { ...updated };
}

async function refundPaymentIntent(paymentId) {
  const intent = await getPaymentIntent(paymentId);

  if (intent.status !== 'succeeded') {
    const error = new Error('Only succeeded payment intents can be refunded');
    error.status = 409;
    throw error;
  }

  const updatedAt = new Date().toISOString();
  const updated = { ...intent, status: 'refunded', refundedAt: updatedAt, updatedAt };
  paymentIntents.set(paymentId, updated);

  return { ...updated };
}

module.exports = {
  generatePaymentId,
  createPaymentIntent,
  getPaymentIntent,
  listPaymentIntents,
  confirmPaymentIntent,
  cancelPaymentIntent,
  refundPaymentIntent,
};
