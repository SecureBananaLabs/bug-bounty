/**
 * @file proposal.js
 * Proposal creation and update validation schema enforcing estimatedDuration length bounds (1-100 chars).
 */

'use strict';

import { z } from 'zod';

export const createProposalSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  freelancerId: z.string().min(1, 'freelancerId is required'),
  coverLetter: z.string().min(10, 'coverLetter must be at least 10 characters'),
  bidAmount: z.number().positive('bidAmount must be a positive number'),
  estimatedDuration: z
    .string()
    .min(1, 'estimatedDuration is required')
    .max(100, 'estimatedDuration must not exceed 100 characters'),
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
 * @returns {{ success: boolean, data?: Object, errors?: string[] }}
 */
export function validateCreateProposal(payload) {
  const result = createProposalSchema.safeParse(payload);
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  };
}
