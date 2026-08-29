/**
 * @file review.js
 * Review creation validation schema and helpers enforcing targetUserId, rating bounds (1-5), and comment length bounds (5-1000 characters).
 */

'use strict';

import { z } from 'zod';

export const createReviewSchema = z.object({
  targetUserId: z
    .string({
      required_error: 'targetUserId is required',
      invalid_type_error: 'targetUserId must be a string',
    })
    .min(1, 'targetUserId is required')
    .optional(),
  freelancerId: z.string().min(1).optional(),
  rating: z
    .number({
      required_error: 'rating is required',
      invalid_type_error: 'rating must be an integer between 1 and 5',
    })
    .int('rating must be an integer between 1 and 5')
    .min(1, 'rating must be an integer between 1 and 5')
    .max(5, 'rating must be an integer between 1 and 5'),
  comment: z
    .string({
      required_error: 'comment is required',
      invalid_type_error: 'comment must be a string',
    })
    .min(5, 'Review comment must be between 5 and 1000 characters')
    .max(1000, 'Review comment must be between 5 and 1000 characters'),
  contractId: z.string().optional(),
}).refine((data) => Boolean(data.targetUserId || data.freelancerId), {
  message: 'targetUserId is required',
  path: ['targetUserId'],
});

/**
 * Validates whether a review comment satisfies length bounds (5 to 1000 chars).
 *
 * @param {string} comment
 * @returns {boolean}
 */
export function isValidReviewComment(comment) {
  if (!comment || typeof comment !== 'string') {
    return false;
  }
  const trimmed = comment.trim();
  return trimmed.length >= 5 && trimmed.length <= 1000;
}

/**
 * Validates whether a rating is a valid integer between 1 and 5.
 *
 * @param {number|string} rating
 * @returns {boolean}
 */
export function isValidRating(rating) {
  const num = Number(rating);
  return Number.isInteger(num) && num >= 1 && num <= 5;
}

/**
 * Validates a review creation request payload.
 *
 * @param {Object} payload
 * @returns {{ valid: boolean, error?: string, errors?: string[], data?: Object }}
 */
export function validateCreateReview(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Valid review payload is required',
      errors: ['Valid review payload is required'],
    };
  }

  const result = createReviewSchema.safeParse(payload);
  if (result.success) {
    const data = result.data;
    const sanitized = {
      rating: data.rating,
      comment: data.comment.trim(),
      targetUserId: data.targetUserId ?? data.freelancerId,
      freelancerId: data.freelancerId ?? data.targetUserId,
      contractId: data.contractId ?? null,
    };
    return {
      valid: true,
      data: sanitized,
    };
  }

  const errors = result.error.errors.map((e) => e.message);
  return {
    valid: false,
    error: errors[0],
    errors,
  };
}
