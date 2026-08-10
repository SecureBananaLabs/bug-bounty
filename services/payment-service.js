/**
 * Payment Service - Stripe Integration
 * Implements secure payment intent creation using Stripe SDK.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Validates payment payload before creating a Stripe PaymentIntent.
 * @param {Object} payload - The payment payload
 * @returns {Object} Validated and normalized payload
 * @throws {Error} If validation fails
 */
function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payment payload must be a non-null object');
  }

  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer (in smallest currency unit, e.g., cents)');
  }

  const currency = payload.currency || 'usd';
  if (typeof currency !== 'string' || currency.length !== 3) {
    throw new Error('Currency must be a 3-letter ISO currency code');
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: payload.metadata || {},
  };
}

/**
 * Creates a Stripe PaymentIntent for the given payment payload.
 * @param {Object} payload - Payment payload with amount, currency, and optional metadata
 * @returns {Promise<Object>} Result with clientSecret and paymentId
 * @throws {Error} If Stripe API call fails or payload is invalid
 */
async function createPaymentIntent(payload) {
  const validated = validatePaymentPayload(payload);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validated.amount,
      currency: validated.currency,
      metadata: {
        ...validated.metadata,
        created_via: 'bug-bounty-payment-service',
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created,
    };
  } catch (error) {
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      throw new Error(`Card error: ${error.message}`);
    }
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    }
    if (error.type === 'StripeAPIError') {
      throw new Error(`Stripe API error: ${error.message}`);
    }
    // Generic error
    throw new Error(`Payment failed: ${error.message}`);
  }
}

module.exports = {
  createPaymentIntent,
  validatePaymentPayload,
};
