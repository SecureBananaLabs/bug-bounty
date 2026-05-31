const reviews = [];
const ALLOWED_FIELDS = ["jobId", "rating", "comment", "reviewerId"];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const review = { id: `rev_${Date.now()}`, ...sanitized };
  reviews.push(review);
  return review;
}
