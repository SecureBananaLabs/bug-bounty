/**
 * @file payment.js
 * Payment creation validation schema and helpers enforcing positive amount, supported currencies, and transactionId constraints.
 */

'use strict';

import { z } from 'zod';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'usd', 'eur', 'gbp'];

export const createPaymentSchema = z.object({
  transactionId: z
    .string({
      required_error: 'transactionId must be between 8 and 64 characters',
      invalid_type_error: 'transactionId must be between 8 and 64 characters',
    })
    .min(8, 'transactionId must be between 8 and 64 characters')
    .max(64, 'transactionId must not exceed 64 characters'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && Number.isFinite(val) && val > 0, {
      message: 'Valid positive amount is required',
    }),
  currency: z
    .string({
      invalid_type_error: 'Currency must be a string',
    })
    .optional()
    .default('USD')
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => ['USD', 'EUR', 'GBP'].includes(val), {
      message: 'Currency must be one of: usd, eur, gbp',
    }),
  contractId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
});

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
 * @returns {{ valid: boolean, error?: string, errors?: string[], data?: Object }}
 */
export function validateCreatePayment(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Valid payment payload is required',
      errors: ['Valid payment payload is required'],
    };
  }

  // Pre-validate transactionId
  if (!isValidTransactionId(payload.transactionId)) {
    return {
      valid: false,
      error: 'transactionId must be between 8 and 64 characters',
      errors: ['transactionId must be between 8 and 64 characters'],
    };
  }

  // Pre-validate amount
  const numAmount = Number(payload.amount);
  if (isNaN(numAmount) || !Number.isFinite(numAmount) || numAmount <= 0) {
    return {
      valid: false,
      error: 'Valid positive amount is required',
      errors: ['Valid positive amount is required'],
    };
  }

  const result = createPaymentSchema.safeParse(payload);
  if (result.success) {
    const d = result.data;
    return {
      valid: true,
      data: {
        amount: d.amount,
        currency: d.currency,
        transactionId: String(d.transactionId).trim(),
        contractId: d.contractId ? String(d.contractId).trim() : null,
        milestoneId: d.milestoneId ? String(d.milestoneId).trim() : null,
      },
    };
  }

  const errors = result.error.errors.map((e) => e.message);
  return {
    valid: false,
    error: errors[0],
    errors,
  };
}
