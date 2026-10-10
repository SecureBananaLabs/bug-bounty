const { z } = require('zod');

/**
 * Validation schema for POST /api/payments (payment intent creation).
 * Requires a positive numeric amount and a non-empty currency code.
 */
const createPaymentSchema = z.object({
  amount: z
    .number({
      required_error: 'amount is required',
      invalid_type_error: 'amount must be a number',
    })
    .positive('amount must be a positive number'),
  currency: z
    .string({
      required_error: 'currency is required',
      invalid_type_error: 'currency must be a string',
    })
    .min(1, 'currency must not be empty'),
});

module.exports = {
  createPaymentSchema,
};
