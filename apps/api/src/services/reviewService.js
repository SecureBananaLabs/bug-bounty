const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignoredId, reviewerId: _ignoredReviewerId, targetId: _ignoredTargetId, rating: _ignoredRating, comment: _ignoredComment, ...safePayload } = payload || {};
  const review = { id: `rev_${Date.now()}`, ...safePayload };
  reviews.push(review);
  return review;
}
