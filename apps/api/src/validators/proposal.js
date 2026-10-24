/**
 * @file proposal.js
 * Proposal creation and update validation schema enforcing jobId, bidAmount, coverLetter (min 10 chars), and estimatedDuration/estimatedDays bounds.
 */

'use strict';

import { z } from 'zod';

export const createProposalSchema = z.object({
  jobId: z
    .string({
      required_error: 'jobId is required',
      invalid_type_error: 'jobId must be a string',
    })
    .min(1, 'jobId is required'),
  freelancerId: z
    .string({
      invalid_type_error: 'freelancerId must be a string',
    })
    .min(1, 'freelancerId is required')
    .optional(),
  coverLetter: z
    .string({
      required_error: 'coverLetter is required',
      invalid_type_error: 'coverLetter must be a string',
    })
    .min(10, 'coverLetter must be at least 10 characters'),
  bidAmount: z
    .number({
      required_error: 'bidAmount is required',
      invalid_type_error: 'bidAmount must be a positive number',
    })
    .positive('bidAmount must be a positive number'),
  estimatedDuration: z
    .string()
    .min(1, 'estimatedDuration must be at least 1 character')
    .max(100, 'estimatedDuration must not exceed 100 characters')
    .optional(),
  estimatedDays: z
    .number()
    .int('estimatedDays must be an integer')
    .positive('estimatedDays must be positive')
    .optional(),
});

export const updateProposalSchema = createProposalSchema.partial();

/**
 * Validates whether an estimatedDuration string satisfies the length bounds (1-100 chars).
 *
 * @param {string} duration
 * @returns {boolean}
 */
export function isValidEstimatedDuration(duration) {
  if (!duration || typeof duration !== 'string') {
    return false;
  }
  const trimmed = duration.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

/**
 * Validates a proposal creation payload against the schema.
 *
 * @param {Object} payload
 * @returns {{ success: boolean, valid: boolean, data?: Object, error?: string, errors?: string[] }}
 */
export function validateCreateProposal(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      valid: false,
      error: 'Valid proposal payload is required',
      errors: ['Valid proposal payload is required'],
    };
  }

  const result = createProposalSchema.safeParse(payload);
  if (result.success) {
    return {
      success: true,
      valid: true,
      data: result.data,
    };
  }

  const errors = result.error.errors.map((e) => e.message);
  return {
    success: false,
    valid: false,
    error: errors[0],
    errors,
  };
}
