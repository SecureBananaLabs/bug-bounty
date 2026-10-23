const reviews = [];

export async function listReviews() {
  return [...reviews];
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...payload
  };
  reviews.push(review);
  return review;
}

/**
 * Computes the aggregate rating average (rounded to 1 decimal place) and total
 * review count for a given freelancer ID.
 *
 * @param {string} freelancerId
 * @returns {Promise<{ averageRating: number, totalReviews: number }>}
 */
export async function getFreelancerRating(freelancerId) {
  if (!freelancerId || typeof freelancerId !== "string") {
    return { averageRating: 0, totalReviews: 0 };
  }

  const matched = reviews.filter(
    (r) =>
      (r.freelancerId === freelancerId || r.revieweeId === freelancerId) &&
      typeof r.rating === "number" &&
      Number.isFinite(r.rating) &&
      r.rating >= 1 &&
      r.rating <= 5
  );

  const totalReviews = matched.length;
  if (totalReviews === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const sum = matched.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / totalReviews) * 10) / 10;

  return { averageRating, totalReviews };
}

export function _resetReviewsForTesting() {
  reviews.length = 0;
}
