<content>
const crypto = require('crypto');

/**
 * Creates a payment intent with a collision-resistant server-owned ID.
 * @param {Object} payload - The payment payload.
 * @returns {Object} The created payment intent.
 */
function createPaymentIntent(payload) {
  // Generate a unique ID using a combination of timestamp and a random value
  // to ensure uniqueness even when called multiple times in the same millisecond.
  const timestamp = Date.now();
  const randomValue = crypto.randomBytes(8).toString('hex');
  paymentId: `pay_${timestamp}_${randomValue}`,

  // Simulating the rest of the function's behavior
  return {
    paymentId: `pay_${timestamp}_${randomValue}`,
    amount: payload.amount,
    currency: payload.currency,
    status: 'requires_payment_method',
    clientSecret: `pi_${randomValue}_secret`,
  };
}

module.exports = {
  createPaymentIntent,
};
</content>