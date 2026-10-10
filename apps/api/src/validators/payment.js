/**
 * @file payment.js
 * Payment creation validator enforcing transactionId length bounds (8-64 characters) and amount constraints.
 */

'use strict';

/**
 * Validates whether a transactionId string satisfies the length bounds (8 to 64 chars).
 *
 * @param {string} transactionId
 * @returns {boolean}
 */
export function isValidTransactionId(transactionId) {
  if (!transactionId || typeof transactionId !== 'string') {
    return false;
  }
  const trimmed = transactionId.trim();
  return trimmed.length >= 8 && trimmed.length <= 64;
}

/**
 * Validates a payment creation request payload.
 *
 * @param {Object} payload
 * @returns {{ valid: boolean, error?: string, data?: Object }}
 */
export function validateCreatePayment(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Valid payment payload is required',
    };
  }

  const { transactionId, amount, currency, contractId, milestoneId } = payload;

  if (!isValidTransactionId(transactionId)) {
    return {
      valid: false,
      error: 'transactionId must be between 8 and 64 characters',
    };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || !Number.isFinite(numAmount) || numAmount <= 0) {
    return {
      valid: false,
      error: 'Valid positive amount is required',
    };
  }

  const sanitized = {
    transactionId: String(transactionId).trim(),
    amount: numAmount,
    currency: typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'USD',
    contractId: typeof contractId === 'string' ? contractId.trim() : null,
    milestoneId: typeof milestoneId === 'string' ? milestoneId.trim() : null,
  };

  return {
    valid: true,
    data: sanitized,
  };
}
