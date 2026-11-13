/**
 * @file reviewService.js
 * In-memory review management service and aggregate rating computation.
 */

'use strict';

const reviews = [];

/**
 * Lists all stored reviews.
 * @returns {Promise<Array>}
 */
export async function listReviews() {
  return [...reviews];
}

/**
 * Creates and appends a new review to the collection.
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...payload };
  reviews.push(review);
  return review;
}

/**
 * Computes aggregate star rating average and total review count for a specific freelancer.
 *
 * @param {string} freelancerId - The unique ID of the freelancer.
 * @returns {Promise<{ averageRating: number, totalReviews: number }>}
 */
export async function getFreelancerRating(freelancerId) {
  if (!freelancerId || typeof freelancerId !== 'string') {
    return { averageRating: 0, totalReviews: 0 };
  }

  const matching = reviews.filter(
    (r) => r.freelancerId === freelancerId && typeof r.rating === 'number' && Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5
  );

  if (matching.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const total = matching.reduce((acc, curr) => acc + curr.rating, 0);
  const average = Number((total / matching.length).toFixed(1));

  return {
    averageRating: average,
    totalReviews: matching.length,
  };
}

/**
 * Utility helper to compute rating metrics from an arbitrary list of numeric scores.
 *
 * @param {number[]} ratings
 * @returns {{ averageRating: number, totalReviews: number }}
 */
export function computeAverageRating(ratings = []) {
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const valid = ratings.filter((r) => typeof r === 'number' && Number.isFinite(r) && r >= 1 && r <= 5);
  if (valid.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const sum = valid.reduce((acc, val) => acc + val, 0);
  return {
    averageRating: Number((sum / valid.length).toFixed(1)),
    totalReviews: valid.length,
  };
}

/**
 * Clears the internal in-memory reviews store (primarily for unit testing).
 */
export function _resetReviewsForTesting() {
  reviews.length = 0;
}
