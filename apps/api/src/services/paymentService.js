'use strict';

const { randomUUID } = require('node:crypto');

const DEFAULT_CURRENCY = 'usd';

/**
 * Normalize a caller-supplied currency value into its canonical form.
 * Trims surrounding whitespace, lowercases the code, and falls back to
 * the default currency for blank or non-string input.
 *
 * @param {*} currency raw currency value from the request payload
 * @returns {string} canonical lowercase currency code
 */
function normalizeCurrency(currency) {
  if (typeof currency !== 'string') {
    return DEFAULT_CURRENCY;
  }

  const normalized = currency.trim().toLowerCase();

  return normalized.length === 0 ? DEFAULT_CURRENCY : normalized;
}

/**
 * Create a payment intent. The returned intent always carries a canonical
 * lowercase currency value (e.g. "usd"), regardless of how the caller
 * submitted it (e.g. " USD ").
 *
 * @param {object} payload
 * @returns {Promise<object>} payment intent
 */
async function createPaymentIntent(payload = {}) {
  return {
    id: `pi_${randomUUID()}`,
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    status: 'requires_payment_method',
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  DEFAULT_CURRENCY,
  normalizeCurrency,
  createPaymentIntent,
};
