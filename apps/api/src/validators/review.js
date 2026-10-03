/**
 * @file review.js
 * Review creation validator enforcing rating bounds (1-5) and comment length bounds (5-1000 characters).
 */

'use strict';

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
 * @returns {{ valid: boolean, error?: string, data?: Object }}
 */
export function validateCreateReview(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Valid review payload is required',
    };
  }

  const { rating, comment, freelancerId, contractId } = payload;

  if (!isValidRating(rating)) {
    return {
      valid: false,
      error: 'Rating must be an integer between 1 and 5',
    };
  }

  if (!isValidReviewComment(comment)) {
    return {
      valid: false,
      error: 'Review comment must be between 5 and 1000 characters',
    };
  }

  const sanitized = {
    rating: Number(rating),
    comment: String(comment).trim(),
    freelancerId: typeof freelancerId === 'string' ? freelancerId.trim() : null,
    contractId: typeof contractId === 'string' ? contractId.trim() : null,
  };

  return {
    valid: true,
    data: sanitized,
  };
}
