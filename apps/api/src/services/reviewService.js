const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  // Fix #5203: Prevent caller from overriding server-generated id
  const { id: _ignored, ...safePayload } = payload;
  const review = { id: `rev_${Date.now()}`, ...safePayload };
  reviews.push(review);
  return review;
}
