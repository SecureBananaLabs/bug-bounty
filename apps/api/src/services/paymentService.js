import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-16',
});

const SUPPORTED_CURRENCIES = [
  'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'cny', 'sar', 'aed',
  'inr', 'brl', 'mxn', 'sgd', 'try', 'chf', 'sek', 'nok', 'dkk',
  'nzd', 'krw', 'hkd', 'thb', 'myr', 'php', 'idr', 'vnd'
];

/**
 * Validates the payment payload.
 * @param {object} payload
 * @throws {Error} with a user-friendly message if validation fails.
 */
function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is required');
  }

  const amount = Number(payload.amount);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount * 100)) {
    throw new Error('amount must be a positive number (minimum 0.50 in the chosen currency)');
  }

  const cents = Math.round(amount * 100);
  if (cents < 50) {
    throw new Error('amount must be at least 0.50');
  }

  const currency = (payload.currency || 'usd').toLowerCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error(`Unsupported currency "${payload.currency}". Supported: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  return { amount: cents, currency };
}

/**
 * Creates a Stripe PaymentIntent.
 * Replaces the previous stub implementation with a real Stripe API call.
 *
 * @param {object} payload - { amount: number, currency?: string, metadata?: object }
 * @returns {Promise<object>} { paymentId, clientSecret, amount, currency, provider }
 */
export async function createPaymentIntent(payload) {
  const { amount, currency } = validatePayload(payload);

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      'Stripe is not configured. Set the STRIPE_SECRET_KEY environment variable.'
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...(payload.metadata || {}),
        source: 'freelanceflow-api',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100,
      currency: paymentIntent.currency,
      provider: 'stripe',
      status: paymentIntent.status,
    };
  } catch (stripeError) {
    // Map common Stripe errors to user-friendly messages
    const message = mapStripeError(stripeError);
    throw new Error(`Payment processing error: ${message}`);
  }
}

/**
 * Maps Stripe API errors to user-friendly messages.
 */
function mapStripeError(error) {
  switch (error.type) {
    case 'StripeCardError':
      return 'Your card was declined. Please try a different payment method.';
    case 'StripeRateLimitError':
      return 'Too many requests. Please try again shortly.';
    case 'StripeInvalidRequestError':
      return `Invalid payment request: ${error.message}`;
    case 'StripeAPIError':
      return 'A payment processing error occurred. Please try again.';
    case 'StripeConnectionError':
      return 'Could not connect to payment processor. Please try again.';
    case 'StripeAuthenticationError':
      return 'Payment system authentication failed. Please contact support.';
    default:
      return error.message || 'An unexpected payment error occurred.';
  }
}
