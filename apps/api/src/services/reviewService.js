const reviews = [];

export async function listReviews() {
  return reviews;
}

const ALLOWED_REVIEW_FIELDS = ["userId", "jobId", "rating", "comment"];

export async function createReview(payload) {
  const sanitized = {};
  for (const field of ALLOWED_REVIEW_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const review = { id: `rev_${Date.now()}`, ...sanitized };
  reviews.push(review);
  return review;
}
